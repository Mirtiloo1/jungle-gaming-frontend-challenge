import type { MockCheckoutAccount } from './checkout-types'

type MockAccount = {
  id: string
  name: string
  email: string
  passwordHash: string
  username?: string
  avatar?: string | null
}
export type MockDatabase = {
  version: 1
  favorites: Record<string, string[]>
  sessions: Record<string, { userId: string; expiresAt: number }>
  users: MockAccount[]
  carts: Record<
    string,
    { nftId: string; editionId: string; quantity: number }[]
  >
  cartWarnings: Record<string, string[]>
  cartPromotions: Record<string, string>
  nftMarket: Record<
    string,
    { version: number; price: string; available: number }
  >
  checkout: Record<string, MockCheckoutAccount>
}

const key = 'kurio.mock-database.v1'
const fresh = (): MockDatabase => ({
  version: 1,
  favorites: {},
  sessions: {},
  users: [],
  carts: {},
  cartWarnings: {},
  cartPromotions: {},
  nftMarket: {},
  checkout: {},
})

export function readDatabase(): MockDatabase {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (data?.version === 1 && data.favorites && data.sessions)
      return {
        ...data,
        users: Array.isArray(data.users) ? data.users : [],
        carts: data.carts ?? {},
        cartWarnings: data.cartWarnings ?? {},
        cartPromotions: data.cartPromotions ?? {},
        nftMarket: data.nftMarket ?? {},
        checkout: data.checkout ?? {},
      }
  } catch {
    /* Um armazenamento inválido volta ao cenário inicial. */
  }
  return fresh()
}

export function writeDatabase(data: MockDatabase) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const mockUsers = [
  { id: 'ana', name: 'Ana', email: 'ana@kurio.test' },
  { id: 'bruno', name: 'Bruno', email: 'bruno@kurio.test' },
]

const demoPasswordHash =
  '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4'
export function allMockUsers(data = readDatabase()): MockAccount[] {
  return [
    ...new Map(
      [
        ...mockUsers.map((user) => ({
          ...user,
          passwordHash: demoPasswordHash,
        })),
        ...data.users,
      ].map((user) => [user.id, user]),
    ).values(),
  ]
}
export function publicUser(user: MockAccount) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
  }
}
export async function hashMockPassword(password: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)),
    ),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function authenticatedUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  const session = token ? readDatabase().sessions[token] : undefined
  return session && session.expiresAt > Date.now()
    ? (() => {
        const user = allMockUsers().find((user) => user.id === session.userId)
        return user ? publicUser(user) : undefined
      })()
    : undefined
}
