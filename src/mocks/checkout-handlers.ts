import { delay, http, HttpResponse } from 'msw'
import { authenticatedUser, readDatabase, writeDatabase } from './database'
import { cartResponse } from './cart'
import {
  cartFingerprint,
  checkoutAccount,
  profileErrors,
  recoverOrder,
  settleOrder,
  walletErrors,
} from './checkout'
import type {
  CollectorProfile,
  Order,
  OrderInput,
  Provider,
  Quote,
  Wallet,
} from '@/features/checkout/types'

const fail = (message: string, status: number, extra = {}) =>
  HttpResponse.json({ message, ...extra }, { status })
const scenario = () => localStorage.getItem('kurio.mock-scenario') ?? 'default'
const providers = ['walletconnect', 'metamask', 'coinbase']

export const checkoutHandlers = [
  http.get('*/api/orders', async ({ request }) => {
    await delay(120)
    const user = authenticatedUser(request)
    if (!user) return fail('Entre na sua conta para continuar.', 401)
    const data = readDatabase()
    const account = checkoutAccount(data, user)
    for (const id of Object.keys(account.orders)) settleOrder(data, user.id, id)
    writeDatabase(data)
    return HttpResponse.json({
      orders: Object.values(account.orders)
        .map(({ order }) => order)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    })
  }),
  http.get('*/api/checkout', async ({ request }) => {
    await delay(120)
    const user = authenticatedUser(request)
    if (!user) return fail('Entre na sua conta para continuar.', 401)
    if (scenario() === 'checkout-error')
      return fail(
        'O pagamento está temporariamente indisponível. Tente novamente.',
        503,
      )
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    writeDatabase(data)
    return HttpResponse.json({
      profile: account.profile,
      wallets: account.wallets,
    })
  }),
  http.put('*/api/checkout/profile', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    const profile = (await request.json()) as CollectorProfile
    const fields = profileErrors(profile ?? {})
    if (Object.keys(fields).length)
      return fail('Revise os dados do colecionador.', 422, { fields })
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    account.profile = profile
    writeDatabase(data)
    return HttpResponse.json({ profile })
  }),
  http.post('*/api/wallets', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Entre novamente.', 401)
    const input = (await request.json()) as Wallet
    const body = {
      ...input,
      name: typeof input?.name === 'string' ? input.name.trim() : input?.name,
      address:
        typeof input?.address === 'string'
          ? input.address.trim()
          : input?.address,
      ens: typeof input?.ens === 'string' ? input.ens.trim() : input?.ens,
    }
    const fields = walletErrors(body ?? {})
    if (Object.keys(fields).length)
      return fail(
        'Revise os campos destacados para cadastrar a carteira.',
        422,
        { fields },
      )
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    if (
      account.wallets.some(
        (wallet) =>
          wallet.address.toLowerCase() === body.address.toLowerCase() &&
          wallet.network === body.network,
      )
    )
      return fail('Esta carteira já foi cadastrada nesta rede.', 409)
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      address: body.address,
      ens: body.ens,
      network: body.network,
      connected: false,
      provider: null,
      kind: body.kind ?? 'coinbase',
      isPrimary: account.wallets.length === 0,
      details: body.details,
    }
    account.wallets.push(wallet)
    writeDatabase(data)
    return HttpResponse.json(wallet, { status: 201 })
  }),
  http.post('*/api/wallets/:id/connection', async ({ request, params }) => {
    await delay(500)
    const user = authenticatedUser(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    const body = (await request.json()) as {
      provider: Provider
      connect: boolean
    }
    if (!providers.includes(body.provider) || typeof body.connect !== 'boolean')
      return fail('Selecione uma carteira válida.', 422)
    if (body.connect && scenario() === 'wallet-rejected')
      return fail(
        'Conexão recusada na carteira. Você pode tentar novamente ou trocar de carteira.',
        409,
      )
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    const wallet = account.wallets.find((item) => item.id === params.id)
    if (!wallet) return fail('Carteira não encontrada.', 404)
    for (const item of account.wallets) {
      item.connected = false
      item.provider = null
    }
    wallet.connected = body.connect
    wallet.provider = body.connect ? body.provider : null
    writeDatabase(data)
    return HttpResponse.json({ wallets: account.wallets })
  }),
  http.post('*/api/checkout/quote', async ({ request }) => {
    await delay(150)
    const user = authenticatedUser(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    const { walletId, provider } = (await request.json()) as {
      walletId: string
      provider: Provider
    }
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    const wallet = account.wallets.find((item) => item.id === walletId)
    if (!wallet?.connected || wallet.provider !== provider)
      return fail('Conecte a carteira selecionada para continuar.', 409)
    const summary = cartResponse(data, `user:${user.id}`)
    if (!summary.items.length) return fail('Seu carrinho está vazio.', 409)
    if (summary.items.some((item) => item.quantity > item.maximum))
      return fail('O estoque mudou. Revise as quantidades no carrinho.', 409)
    const quote: Quote = {
      id: crypto.randomUUID(),
      walletId,
      provider,
      network: wallet.network,
      walletAddress: wallet.address,
      expiresAt: Date.now() + 120_000,
      summary,
    }
    account.quotes[quote.id] = quote
    // Mantém apenas cotações recentes, sem remover as referenciadas pelos pedidos.
    for (const [id, old] of Object.entries(account.quotes))
      if (old.expiresAt < Date.now() - 600_000) delete account.quotes[id]
    writeDatabase(data)
    return HttpResponse.json(quote)
  }),
  http.post('*/api/orders', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sua sessão expirou. Entre novamente.', 401)
    const key = request.headers.get('Idempotency-Key')
    if (!key || !/^[a-zA-Z0-9-]{10,100}$/.test(key))
      return fail('Chave da tentativa inválida.', 422)
    const body = (await request.json()) as OrderInput
    const fingerprint = JSON.stringify(body)
    const data = readDatabase(),
      account = checkoutAccount(data, user)
    const existing = account.attempts[key]
    if (existing) {
      if (existing.fingerprint !== fingerprint)
        return fail('Esta tentativa já foi usada com outros dados.', 409, {
          code: 'IDEMPOTENCY_CONFLICT',
        })
      return HttpResponse.json(settleOrder(data, user.id, existing.orderId))
    }
    if (Object.keys(profileErrors(body.profile ?? {})).length)
      return fail('Revise os dados do colecionador.', 422, {
        fields: profileErrors(body.profile ?? {}),
      })
    const quote = account.quotes[body.quoteId]
    if (!quote || quote.expiresAt < Date.now())
      return fail('A cotação expirou. Revise os valores novamente.', 409, {
        code: 'QUOTE_CHANGED',
      })
    const wallet = account.wallets.find((item) => item.id === quote.walletId)
    if (
      !wallet?.connected ||
      wallet.provider !== quote.provider ||
      wallet.address !== quote.walletAddress ||
      wallet.network !== quote.network
    )
      return fail('A carteira foi desconectada. Conecte novamente.', 409)
    const pending = Object.values(account.orders).find(
      (record) => record.order.status === 'pending',
    )
    if (pending)
      return fail(
        'Existe uma compra em andamento. Aguarde a confirmação.',
        409,
        { orderId: pending.order.id },
      )
    if (scenario() === 'quote-changed' && account.fee === '0.016') {
      account.fee = '0.020'
      writeDatabase(data)
    }
    if (JSON.stringify(quote.summary) !== cartFingerprint(data, user.id))
      return fail(
        'Os valores foram atualizados. Revise a nova cotação antes de confirmar.',
        409,
        { code: 'QUOTE_CHANGED' },
      )
    if (scenario() === 'checkout-error')
      return fail(
        'Falha de conexão. A compra não foi enviada. Tente novamente.',
        503,
      )
    const order: Order = {
      id: crypto.randomUUID(),
      status: 'pending',
      version: 1,
      createdAt: new Date().toISOString(),
      transactionId: null,
      reason: null,
      wallet: structuredClone(wallet),
      profile: body.profile,
      summary: structuredClone(quote.summary),
    }
    account.orders[order.id] = {
      order,
      settled: false,
      outcome: scenario() === 'payment-declined' ? 'declined' : 'confirmed',
      resolvesAt: Date.now() + (scenario() === 'order-pending' ? 7000 : 1800),
    }
    account.attempts[key] = { fingerprint, orderId: order.id }
    account.profile = body.profile
    writeDatabase(data)
    if (scenario() === 'order-timeout') await delay(4500)
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('*/api/orders/attempt/:key', async ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Entre novamente para recuperar a compra.', 401)
    const data = readDatabase(),
      id = data.checkout[user.id]?.attempts[String(params.key)]?.orderId
    if (!id)
      return fail(
        'Tentativa ainda não registrada. Você pode reenviá-la com segurança.',
        404,
      )
    return HttpResponse.json(settleOrder(data, user.id, id))
  }),
  http.get('*/api/orders/:id', async ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Entre novamente para consultar o pedido.', 401)
    const order = recoverOrder(user.id, String(params.id))
    return order
      ? HttpResponse.json(order)
      : fail('Pedido não encontrado nesta conta.', 404)
  }),
]
