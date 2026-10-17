import { Heart, ScanLine } from 'lucide-react'
import { Link, useRouterState, useSearch } from '@tanstack/react-router'
import MobileCatalogFilters from '@/features/catalog/components/MobileCatalogFilters'
import type { CatalogControlsProps } from '@/features/catalog/types'
import CatalogSearchInput from '@/features/catalog/components/CatalogSearchInput'
import DesktopCatalogSearch from '@/features/catalog/components/DesktopCatalogSearch'
import SessionButton from '@/features/auth/SessionButton'
import { useAuth } from '@/features/auth/context'
import { cn } from '@/lib/utils'
import CartButton from '@/features/cart/CartButton'

const navigation = [
  { label: 'Início', section: 'inicio', hash: '' },
  { label: 'Mercado', section: 'mercado', hash: 'catalogo' },
  { label: 'Criadores', section: 'criadores', hash: 'criadores' },
  { label: 'Aprenda', section: 'aprenda', hash: 'aprenda' },
] as const

export default function Header({
  filters,
  onFiltersChange,
  onApplyFilters,
  collectionCounts,
  networkCounts,
}: CatalogControlsProps) {
  const { user, openLogin } = useAuth()
  const { favorites = false } = useSearch({ strict: false })
  const activeSection = useRouterState({
    select: ({ location }) => {
      if (
        location.pathname.startsWith('/nfts/') ||
        location.pathname === '/carrinho' ||
        location.pathname === '/pagamento'
      )
        return 'mercado'
      if (location.pathname.startsWith('/perfil')) return 'inicio'
      if (location.pathname !== '/') return null
      return (
        navigation.find((item) => item.hash === location.hash)?.section ??
        'inicio'
      )
    },
  })
  return (
    <>
      <header className="page-container hidden lg:block">
        <div className="flex h-17.25 items-center justify-between border-b border-border">
          <Link to="/" className="text-sm font-bold tracking-widest">
            KURIO
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex h-full items-center gap-10"
          >
            {navigation.map((item) => (
              <Link
                key={item.section}
                to="/"
                search={item.section === 'inicio' ? {} : true}
                hash={item.hash}
                activeOptions={{
                  exact: true,
                  includeHash: true,
                  includeSearch: false,
                }}
                aria-current={
                  activeSection === item.section ? 'page' : undefined
                }
                className={cn(
                  '-mb-px flex h-full items-center border-b-2 transition-colors hover:text-highlight',
                  activeSection === item.section
                    ? 'border-primary font-bold text-highlight'
                    : 'border-transparent',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <DesktopCatalogSearch />

            <CartButton />

            <SessionButton />
          </div>
        </div>
      </header>

      <header className="page-container flex items-center gap-2 pt-8 pb-4 lg:hidden">
        <CatalogSearchInput />
        <MobileCatalogFilters
          value={filters}
          onChange={onFiltersChange}
          onApply={onApplyFilters}
          collectionCounts={collectionCounts}
          networkCounts={networkCounts}
        />
      </header>

      <nav
        aria-label="Navegação principal mobile"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-center px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-t-[32px] bg-card mask-[radial-gradient(circle_at_50%_0,transparent_45px,black_46px)]"
        />
        <Link
          to="/"
          search={{}}
          hash=""
          activeOptions={{
            exact: true,
            includeHash: true,
            includeSearch: false,
          }}
          aria-current={
            activeSection === 'inicio' && !favorites ? 'page' : undefined
          }
          aria-label="Início"
          className={cn(
            'relative flex min-h-11 min-w-11 items-center justify-center rounded-lg',
            activeSection === 'inicio' && !favorites
              ? 'text-highlight'
              : 'text-muted-foreground',
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-7h6v7h5a1 1 0 0 0 1-1V10L12 3Z" />
          </svg>
        </Link>

        <Link
          to="/"
          search={(previous) => ({
            ...previous,
            favorites: !favorites,
            page: 1,
          })}
          hash="catalogo"
          onClick={(event) => {
            if (!user) {
              event.preventDefault()
              openLogin()
            }
          }}
          aria-label={favorites ? 'Mostrar todos os NFTs' : 'Mostrar favoritos'}
          className={cn(
            'relative flex min-h-11 min-w-11 items-center justify-center rounded-lg',
            favorites ? 'text-highlight' : 'text-muted-foreground',
          )}
        >
          <Heart size={20} fill="currentColor" aria-hidden="true" />
        </Link>

        <span aria-hidden="true" />
        <Link
          to="/"
          search={true}
          hash="catalogo"
          activeOptions={{
            exact: true,
            includeHash: true,
            includeSearch: false,
          }}
          aria-current={
            activeSection === 'mercado' && !favorites ? 'page' : undefined
          }
          aria-label="Explorar coleções"
          className="absolute -top-8 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-primary/90 text-foreground transition hover:brightness-110 active:scale-95"
        >
          <ScanLine size={28} aria-hidden="true" />
        </Link>

        <CartButton compact />

        <SessionButton compact />
      </nav>
    </>
  )
}
