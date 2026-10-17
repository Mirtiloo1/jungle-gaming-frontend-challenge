import type { MockDatabase } from './database'
import { readDatabase, writeDatabase } from './database'
import type { Order, CollectorProfile, Wallet } from '@/features/checkout/types'
import type { SessionUser } from '@/features/auth/context'
import { cartResponse } from './cart'

export function checkoutAccount(data: MockDatabase, user: SessionUser) {
  return (data.checkout[user.id] ??= {
    profile: {
      displayName: user.name,
      username:
        user.name.toLowerCase().replace(/\W/g, '').slice(0, 20) ||
        'colecionador',
      profileName: user.name,
      email: user.email,
      referral: '',
      ens: '',
      notes: '',
    },
    wallets: [
      {
        id: 'reserve',
        name: 'Reserva',
        address: '0x8a91f2583d6f09430229e33bdbf2f6f58e4fe82c',
        ens: 'nova.kurio.eth',
        network: 'polygon',
        connected: false,
        provider: null,
      },
      {
        id: 'primary',
        name: 'Principal',
        address: '0xa91f2583d6f09430229e33bdbf2f6f58e4fe82c1',
        ens: '',
        network: 'ethereum',
        connected: false,
        provider: null,
      },
    ],
    quotes: {},
    orders: {},
    attempts: {},
    fee: '0.016',
  })
}
export function profileErrors(profile: Partial<CollectorProfile>) {
  const errors: Record<string, string> = {}
  if (
    typeof profile.displayName !== 'string' ||
    profile.displayName.trim().length < 2 ||
    profile.displayName.length > 60
  )
    errors.displayName = 'Use de 2 a 60 caracteres.'
  if (
    typeof profile.username !== 'string' ||
    !/^[\p{L}\p{N}_.-]{3,24}$/u.test(profile.username)
  )
    errors.username = 'Use de 3 a 24 letras, números, pontos ou traços.'
  if (
    typeof profile.profileName !== 'string' ||
    profile.profileName.trim().length < 2 ||
    profile.profileName.length > 60
  )
    errors.profileName = 'Informe o nome do perfil (2 a 60 caracteres).'
  if (
    typeof profile.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ||
    profile.email.length > 254
  )
    errors.email = 'Informe um e-mail válido.'
  for (const [name, maximum] of [
    ['referral', 40],
    ['ens', 100],
    ['notes', 1000],
  ] as const) {
    if (typeof profile[name] !== 'string' || profile[name].length > maximum)
      errors[name] = `Use até ${maximum} caracteres.`
  }
  if (profile.ens && !/^[a-z0-9.-]+\.eth$/i.test(profile.ens))
    errors.ens = 'Use um nome ENS terminado em .eth.'
  return errors
}
export function validWallet(wallet: Partial<Wallet>) {
  return (
    typeof wallet.name === 'string' &&
    wallet.name.trim().length >= 2 &&
    wallet.name.length <= 40 &&
    ['ethereum', 'polygon', 'solana'].includes(wallet.network ?? '') &&
    typeof wallet.address === 'string' &&
    (wallet.network === 'solana'
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.address)
      : /^0x[a-fA-F0-9]{40}$/.test(wallet.address)) &&
    typeof wallet.ens === 'string' &&
    (!wallet.ens || /^[a-z0-9.-]+\.eth$/i.test(wallet.ens))
  )
}

export function walletErrors(wallet: Partial<Wallet>) {
  const fields: Record<string, string> = {}
  if (
    typeof wallet.name !== 'string' ||
    wallet.name.trim().length < 2 ||
    wallet.name.length > 40
  )
    fields.name = 'Use um apelido de 2 a 40 caracteres.'
  if (!['ethereum', 'polygon', 'solana'].includes(wallet.network ?? ''))
    fields.network = 'Selecione uma rede válida.'
  if (!validWallet({ ...wallet, name: 'Carteira', ens: '' }))
    fields.address =
      wallet.network === 'solana'
        ? 'Informe um endereço Solana válido, com 32 a 44 caracteres.'
        : 'Use 0x seguido de 40 caracteres de 0 a 9 ou de A a F.'
  if (
    typeof wallet.ens !== 'string' ||
    (wallet.ens && !/^[a-z0-9.-]+\.eth$/i.test(wallet.ens))
  )
    fields.ens = 'Use um nome ENS terminado em .eth.'
  if (
    wallet.kind &&
    !['walletconnect', 'metamask', 'coinbase'].includes(wallet.kind)
  )
    fields.kind = 'Selecione um tipo de carteira.'
  if (wallet.details) {
    if (
      typeof wallet.details.displayName !== 'string' ||
      wallet.details.displayName.trim().length < 2
    )
      fields.displayName = 'Informe o nome de exibição.'
    if (
      typeof wallet.details.profileName !== 'string' ||
      wallet.details.profileName.trim().length < 2
    )
      fields.profileName = 'Informe o nome do perfil.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wallet.details.email))
      fields.email = 'Informe um e-mail válido.'
    const address = wallet.details.secondaryAddress
    if (
      typeof address !== 'string' ||
      (address &&
        !/^(0x[a-fA-F0-9]{40}|[a-z0-9.-]+\.eth|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(
          address,
        ))
    )
      fields.secondaryAddress = 'Informe um endereço ou ENS válido.'
  }
  return fields
}
export function cartFingerprint(data: MockDatabase, userId: string) {
  return JSON.stringify(cartResponse(data, `user:${userId}`))
}
export function settleOrder(
  data: MockDatabase,
  userId: string,
  id: string,
): Order | undefined {
  const account = data.checkout[userId]
  const record = account?.orders[id]
  if (!record) return undefined
  if (!record.settled && Date.now() >= record.resolvesAt) {
    const { order } = record
    order.status = record.outcome
    order.version++
    record.settled = true
    if (order.status === 'confirmed') {
      order.transactionId = `0x${order.id.replaceAll('-', '').padEnd(64, '0').slice(0, 64)}`
      const owner = `user:${userId}`
      for (const bought of order.summary.items) {
        const line = data.carts[owner]?.find(
          (item) =>
            item.nftId === bought.nftId && item.editionId === bought.editionId,
        )
        if (line) line.quantity = Math.max(0, line.quantity - bought.quantity)
      }
      data.carts[owner] = (data.carts[owner] ?? []).filter(
        (item) => item.quantity > 0,
      )
      if (!data.carts[owner].length) delete data.cartPromotions[owner]
    } else
      order.reason =
        'Pagamento recusado pela carteira simulada. Seus NFTs continuam no carrinho.'
    writeDatabase(data)
  }
  return record.order
}
export function recoverOrder(userId: string, id: string) {
  return settleOrder(readDatabase(), userId, id)
}
