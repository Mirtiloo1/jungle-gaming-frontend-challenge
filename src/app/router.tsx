import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router'
import { HomePage } from '@/pages/home'
import { normalizeCatalogSearch } from '@/features/catalog/search'
import type { CatalogSearch } from '@/features/catalog/search'
import NotFoundPage from '@/pages/not-found'
import RootLayout from './RootLayout'

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): CatalogSearch =>
    normalizeCatalogSearch(search),
  component: HomePage,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  validateSearch: (
    search: Record<string, unknown>,
  ): CatalogSearch & { edition?: string } => ({
    ...normalizeCatalogSearch(search),
    edition: typeof search.edition === 'string' ? search.edition : undefined,
  }),
  component: lazyRouteComponent(() => import('@/pages/nft-detail')),
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  validateSearch: (search: Record<string, unknown>): CatalogSearch =>
    normalizeCatalogSearch(search),
  component: lazyRouteComponent(() => import('@/pages/cart')),
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  validateSearch: (search: Record<string, unknown>): { pedido?: string } => ({
    pedido:
      typeof search.pedido === 'string' &&
      /^[a-zA-Z0-9-]{10,100}$/.test(search.pedido)
        ? search.pedido
        : undefined,
  }),
  component: lazyRouteComponent(() => import('@/pages/checkout')),
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: lazyRouteComponent(() => import('@/pages/account')),
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil/carteiras',
  component: lazyRouteComponent(() => import('@/pages/account')),
})
const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil/atividade',
  component: lazyRouteComponent(() => import('@/pages/account')),
})
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil/favoritos',
  component: lazyRouteComponent(() => import('@/pages/account')),
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    nftRoute,
    cartRoute,
    checkoutRoute,
    profileRoute,
    walletsRoute,
    activityRoute,
    favoritesRoute,
  ]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
