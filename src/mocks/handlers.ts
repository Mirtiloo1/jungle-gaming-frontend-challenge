import { delay, http, HttpResponse } from 'msw'
import { catalogFixtures } from './fixtures/catalog'
import {
  authenticatedUser,
  allMockUsers,
  publicUser,
  hashMockPassword,
  readDatabase,
  writeDatabase,
} from './database'
import { ethToUnits, normalizeCatalogSearch } from '@/features/catalog/search'
import type { CatalogResponse } from '@/features/catalog/types'
import { getNftDetail } from './fixtures/nft-detail'
import { cartResponse, mergeGuestCart } from './cart'
import { checkoutHandlers } from './checkout-handlers'
import { accountHandlers } from './account-handlers'
import { updateNftMarket } from './nft-market'

const error = (message: string, status: number) =>
  HttpResponse.json({ message }, { status })
const scenario = () => localStorage.getItem('kurio.mock-scenario') ?? 'default'

export const handlers = [
  ...accountHandlers,
  ...checkoutHandlers,
  http.get('*/api/nft-events', async () => {
    if (scenario() !== 'nft-updated')
      return new HttpResponse(null, { status: 204 })
    await delay(700)
    const event = updateNftMarket()
    return event
      ? HttpResponse.json(event)
      : new HttpResponse(null, { status: 204 })
  }),
  http.patch(
    '*/api/cart/items/:nftId/:editionId',
    async ({ request, params }) => {
      await delay(150)
      const user = authenticatedUser(request)
      if (request.headers.has('Authorization') && !user)
        return error('Sessão expirada. Entre novamente.', 401)
      const owner = user
        ? `user:${user.id}`
        : `guest:${request.headers.get('X-Guest-Id')}`
      const { quantity } = (await request.json()) as { quantity: number }
      const data = readDatabase()
      const line = data.carts[owner]?.find(
        (item) =>
          item.nftId === params.nftId && item.editionId === params.editionId,
      )
      if (!line) return error('Item não encontrado no carrinho.', 404)
      const edition = getNftDetail(line.nftId)?.editions.find(
        (item) => item.id === line.editionId,
      )
      if (!edition || !Number.isInteger(quantity) || quantity < 0)
        return error('Quantidade inválida.', 422)
      if (quantity > Math.min(edition.available, edition.maxPerOrder))
        return error('Quantidade acima do estoque disponível.', 409)
      if (quantity === 0)
        data.carts[owner] = data.carts[owner].filter((item) => item !== line)
      else line.quantity = quantity
      data.cartWarnings[owner] = []
      writeDatabase(data)
      return HttpResponse.json(cartResponse(data, owner))
    },
  ),
  http.put('*/api/cart/promotion', async ({ request }) => {
    await delay(150)
    const user = authenticatedUser(request)
    if (request.headers.has('Authorization') && !user)
      return error('Sessão expirada. Entre novamente.', 401)
    const owner = user
      ? `user:${user.id}`
      : `guest:${request.headers.get('X-Guest-Id')}`
    const body = (await request.json()) as { code?: string }
    const code =
      typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (code === 'KURIOEXPIRED')
      return error('Este código promocional expirou.', 422)
    if (code && code !== 'KURIO10')
      return error('Código promocional inválido.', 422)
    const data = readDatabase()
    data.cartPromotions[owner] = code
    writeDatabase(data)
    return HttpResponse.json(cartResponse(data, owner))
  }),
  http.get('*/api/cart/recommendations', async () => {
    await delay(100)
    return HttpResponse.json({
      items: [
        ...catalogFixtures.slice(3, 7),
        catalogFixtures[8],
        catalogFixtures[7],
        ...catalogFixtures.slice(9, 18),
      ],
    })
  }),
  http.get('*/api/cart', async ({ request }) => {
    await delay(100)
    const user = authenticatedUser(request)
    if (request.headers.has('Authorization') && !user)
      return error('Sessão expirada. Entre novamente.', 401)
    const owner = user
      ? `user:${user.id}`
      : `guest:${request.headers.get('X-Guest-Id')}`
    return HttpResponse.json(cartResponse(readDatabase(), owner))
  }),
  http.post('*/api/cart/items', async ({ request }) => {
    await delay(180)
    const user = authenticatedUser(request)
    if (request.headers.has('Authorization') && !user)
      return error('Sessão expirada. Entre novamente.', 401)
    const body = (await request.json()) as {
      nftId: string
      editionId: string
      quantity: number
    }
    const nft = getNftDetail(body.nftId)
    const edition = nft?.editions.find((item) => item.id === body.editionId)
    if (!nft || !edition) return error('NFT ou edição não encontrados.', 404)
    if (!Number.isInteger(body.quantity) || body.quantity < 1)
      return error('Informe uma quantidade inteira válida.', 422)
    const owner = user
      ? `user:${user.id}`
      : `guest:${request.headers.get('X-Guest-Id')}`
    const data = readDatabase()
    const items = data.carts[owner] ?? []
    const existing = items.find(
      (item) => item.nftId === body.nftId && item.editionId === body.editionId,
    )
    const quantity = (existing?.quantity ?? 0) + body.quantity
    if (quantity > Math.min(edition.available, edition.maxPerOrder))
      return error(
        'A quantidade no carrinho ultrapassa a disponibilidade desta edição.',
        409,
      )
    if (existing) existing.quantity = quantity
    else items.push({ nftId: nft.id, editionId: edition.id, quantity })
    data.carts[owner] = items
    data.cartWarnings[owner] = []
    writeDatabase(data)
    return HttpResponse.json(cartResponse(data, owner), { status: 201 })
  }),
  http.get('*/api/nfts/:id/related', async ({ params }) => {
    await delay(120)
    const detail = getNftDetail(String(params.id))
    if (!detail) return error('NFT não encontrado.', 404)
    return HttpResponse.json({
      items: catalogFixtures
        .filter(
          (item) =>
            item.id !== detail.id && item.collection === detail.collection,
        )
        .slice(0, 15),
    })
  }),
  http.get('*/api/nfts/facets', () => {
    const count = (field: 'collection' | 'network') =>
      catalogFixtures.reduce<Record<string, number>>(
        (counts, item) => ({
          ...counts,
          [item[field]]: (counts[item[field]] ?? 0) + 1,
        }),
        {},
      )
    return HttpResponse.json({
      collectionCounts: count('collection'),
      networkCounts: count('network'),
    })
  }),
  http.get('*/api/nfts', async ({ request }) => {
    await delay(scenario() === 'slow' ? 1200 : 180)
    if (scenario() === 'catalog-error')
      return error('Não foi possível carregar o catálogo.', 503)
    const params = normalizeCatalogSearch(
      Object.fromEntries(new URL(request.url).searchParams),
    )
    const market = readDatabase().nftMarket
    let items = catalogFixtures.map((item) =>
      market[item.id] ? { ...item, price: market[item.id].price } : item,
    )
    if (params.q)
      items = items.filter((item) =>
        item.name.toLocaleLowerCase().includes(params.q.toLocaleLowerCase()),
      )
    if (params.collection)
      items = items.filter((item) => item.collection === params.collection)
    if (params.networks)
      items = items.filter((item) =>
        params.networks.split(',').includes(item.network),
      )
    items = items.filter(
      (item) =>
        ethToUnits(item.price) >= ethToUnits(params.minPrice) &&
        ethToUnits(item.price) <= ethToUnits(params.maxPrice),
    )
    if (params.category === 'new') items = items.filter((item) => item.isNew)
    if (params.category === 'trending')
      items = items.filter((item) => item.trending)
    if (params.favorites) {
      const user = authenticatedUser(request)
      if (!user)
        return error('Entre na sua conta para consultar os favoritos.', 401)
      const ids = readDatabase().favorites[user.id] ?? []
      items = items.filter((item) => ids.includes(item.id))
    }
    items.sort((a, b) => {
      if (params.sort === 'recent')
        return b.createdAt.localeCompare(a.createdAt)
      const first = ethToUnits(a.price),
        second = ethToUnits(b.price)
      const comparison =
        first < second ? -1 : first > second ? 1 : a.id.localeCompare(b.id)
      return params.sort === 'price-asc' ? comparison : -comparison
    })
    const pageSize = 9
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
    const page = Math.min(params.page, totalPages)
    const count = (field: 'collection' | 'network') =>
      catalogFixtures.reduce<Record<string, number>>(
        (counts, item) => ({
          ...counts,
          [item[field]]: (counts[item[field]] ?? 0) + 1,
        }),
        {},
      )
    return HttpResponse.json<CatalogResponse>({
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length,
      totalPages,
      collectionCounts: count('collection'),
      networkCounts: count('network'),
    })
  }),
  http.get('*/api/nfts/:id', async ({ params }) => {
    await delay(scenario() === 'slow' ? 1200 : 180)
    if (scenario() === 'detail-error')
      return error('Não foi possível carregar este NFT.', 503)
    const detail = getNftDetail(String(params.id))
    return detail
      ? HttpResponse.json(detail)
      : error('NFT não encontrado.', 404)
  }),
  http.get('*/api/session', async ({ request }) => {
    await delay(80)
    return HttpResponse.json({ user: authenticatedUser(request) ?? null })
  }),
  http.post('*/api/session', async ({ request }) => {
    await delay(180)
    const body = (await request.json()) as { email?: string; password?: string }
    const user = allMockUsers().find(
      (item) => item.email === body.email?.trim().toLowerCase(),
    )
    const hash = await hashMockPassword(body.password ?? '')
    if (!user || hash !== user.passwordHash)
      return error('E-mail ou senha inválidos.', 401)
    const token = crypto.randomUUID()
    const data = readDatabase()
    data.sessions[token] = {
      userId: user.id,
      expiresAt: Date.now() + 60 * 60 * 1000,
    }
    mergeGuestCart(data, user.id, request.headers.get('X-Guest-Id'))
    writeDatabase(data)
    return HttpResponse.json({ user: publicUser(user), token })
  }),
  http.post('*/api/users', async ({ request }) => {
    await delay(180)
    const body = (await request.json()) as {
      username?: string
      email?: string
      password?: string
      confirmPassword?: string
    }
    const username =
      typeof body.username === 'string' ? body.username.trim() : ''
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const fields: Record<string, string> = {}
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(username))
      fields.username =
        'Use de 3 a 24 letras, números, pontos, traços ou sublinhados.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fields.email = 'Informe um e-mail válido.'
    if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password))
      fields.password =
        'Use pelo menos 8 caracteres, incluindo letras e números.'
    if (password !== body.confirmPassword)
      fields.confirmPassword = 'As senhas precisam ser iguais.'
    if (Object.keys(fields).length)
      return HttpResponse.json(
        { message: 'Confira os campos informados.', fields },
        { status: 422 },
      )
    const passwordHash = await hashMockPassword(password)
    const data = readDatabase()
    const users = allMockUsers(data)
    if (users.some((user) => user.email === email))
      return HttpResponse.json(
        {
          message: 'Este e-mail já está cadastrado.',
          fields: { email: 'Este e-mail já está cadastrado.' },
        },
        { status: 409 },
      )
    if (
      users.some(
        (user) =>
          (user.username ?? user.name).toLowerCase() === username.toLowerCase(),
      )
    )
      return HttpResponse.json(
        {
          message: 'Este nome de usuário já está em uso.',
          fields: { username: 'Este nome de usuário já está em uso.' },
        },
        { status: 409 },
      )
    const user = {
      id: crypto.randomUUID(),
      name: username,
      username,
      email,
      passwordHash,
    }
    const token = crypto.randomUUID()
    data.users.push(user)
    data.sessions[token] = {
      userId: user.id,
      expiresAt: Date.now() + 60 * 60 * 1000,
    }
    mergeGuestCart(data, user.id, request.headers.get('X-Guest-Id'))
    writeDatabase(data)
    return HttpResponse.json({ user: publicUser(user), token }, { status: 201 })
  }),
  http.delete('*/api/session', ({ request }) => {
    const data = readDatabase()
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
    if (token) delete data.sessions[token]
    writeDatabase(data)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('*/api/favorites', async ({ request }) => {
    await delay(100)
    const user = authenticatedUser(request)
    return user
      ? HttpResponse.json({ ids: readDatabase().favorites[user.id] ?? [] })
      : error('Sessão expirada. Entre novamente.', 401)
  }),
  http.put('*/api/favorites/:id', async ({ request, params }) => {
    await delay(scenario() === 'favorite-error' ? 700 : 180)
    const user = authenticatedUser(request)
    if (!user) return error('Sessão expirada. Entre novamente.', 401)
    if (scenario() === 'favorite-error')
      return error(
        'Não foi possível atualizar seu favorito. Tente novamente.',
        503,
      )
    const id = String(params.id)
    if (!catalogFixtures.some((item) => item.id === id))
      return error('NFT não encontrado.', 404)
    const body = (await request.json()) as { favorite?: boolean }
    if (typeof body.favorite !== 'boolean')
      return error('Informe o estado do favorito.', 422)
    const data = readDatabase()
    const ids = new Set(data.favorites[user.id] ?? [])
    if (body.favorite) ids.add(id)
    else ids.delete(id)
    data.favorites[user.id] = [...ids]
    writeDatabase(data)
    return HttpResponse.json({ ids: [...ids] })
  }),
]
