import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import NftCard from '@/features/catalog/components/NftCard'
import CatalogToolbar from './CatalogToolbar'
import CatalogFilters from './CatalogFilters'
import FeaturedNft from './FeaturedNft'
import CatalogPagination from './CatalogPagination'
import type { CatalogControlsProps } from '../types'
import { normalizeCatalogSearch } from '../search'
import { useCatalog } from '../hooks'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/context'
import { apiErrorMessage } from '@/lib/api-error'
import { Heart } from 'lucide-react'

export default function CatalogSection({
  filters,
  onFiltersChange,
  onApplyFilters,
  collectionCounts,
  networkCounts,
}: CatalogControlsProps) {
  const params = normalizeCatalogSearch(useSearch({ from: '/' }))
  const navigate = useNavigate({ from: '/' })
  const { user, loading: sessionLoading, openLogin } = useAuth()
  const catalog = useCatalog(params)
  const favorites = useFavorites()

  useEffect(() => {
    if (catalog.data && catalog.data.page !== params.page) {
      void navigate({
        search: (previous) => ({ ...previous, page: catalog.data.page }),
        replace: true,
      })
    }
  }, [catalog.data, params.page, navigate])

  const clearFilters = () => void navigate({ search: {}, hash: 'catalogo' })

  return (
    <section
      id="catalogo"
      aria-label="Catálogo de NFTs"
      className="mt-12 grid gap-8 lg:mt-24 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <aside
        aria-label="Filtros do catálogo"
        className="hidden space-y-6 lg:block"
      >
        <CatalogFilters
          value={filters}
          onChange={onFiltersChange}
          onApply={onApplyFilters}
          collectionCounts={collectionCounts}
          networkCounts={networkCounts}
        />
        <FeaturedNft />
      </aside>

      <div className="flex min-w-0 flex-col">
        <CatalogToolbar
          category={params.category}
          sort={params.sort}
          onCategoryChange={(category) =>
            void navigate({
              search: (previous) => ({ ...previous, category, page: 1 }),
              hash: 'catalogo',
            })
          }
          onSortChange={(sort) =>
            void navigate({
              search: (previous) => ({ ...previous, sort, page: 1 }),
              hash: 'catalogo',
            })
          }
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p role="status">
            {catalog.data
              ? `${catalog.data.total} NFTs encontrados`
              : 'Consultando catálogo…'}
            {catalog.isFetching && catalog.data ? ' Atualizando…' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              aria-pressed={params.favorites}
              onClick={() => {
                if (!user) openLogin()
                else
                  void navigate({
                    search: (previous) => ({
                      ...previous,
                      favorites: !params.favorites,
                      page: 1,
                    }),
                    hash: 'catalogo',
                  })
              }}
              className="inline-flex min-h-9 items-center gap-2 rounded-sm text-highlight"
            >
              <Heart
                size={14}
                fill={params.favorites ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              {params.favorites ? 'Mostrar todos' : 'Meus favoritos'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-9 rounded-sm hover:text-highlight"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {favorites.mutation.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {apiErrorMessage(favorites.mutation.error)}
          </p>
        )}
        {favorites.query.isError && user && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {apiErrorMessage(favorites.query.error)}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void favorites.query.refetch()}
            >
              Tentar favoritos novamente
            </button>
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {favorites.mutation.isSuccess
            ? 'Favoritos atualizados.'
            : favorites.mutation.isPending
              ? 'Salvando favorito…'
              : ''}
        </p>

        {params.favorites && !user && !sessionLoading ? (
          <div className="mt-6 rounded-xl bg-card p-8 text-center">
            <p>Entre para consultar seus favoritos.</p>
            <button
              type="button"
              onClick={openLogin}
              className="mt-4 min-h-11 rounded-md bg-primary px-5 font-bold text-primary-foreground"
            >
              Entrar para ver favoritos
            </button>
          </div>
        ) : catalog.isPending ? (
          <div
            className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8"
            aria-label="Carregando NFTs"
          >
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} aria-hidden="true">
                <div className="skeleton-shimmer aspect-square rounded-3xl" />
                <div className="skeleton-shimmer mt-3 h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer mt-2 h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : catalog.isError ? (
          <div role="alert" className="mt-6 rounded-xl bg-card p-6">
            <p>{apiErrorMessage(catalog.error)}</p>
            <button
              type="button"
              onClick={() => void catalog.refetch()}
              className="mt-4 min-h-11 rounded-md bg-primary px-5 font-bold text-primary-foreground"
            >
              Tentar novamente
            </button>
          </div>
        ) : catalog.data?.items.length === 0 ? (
          <div className="mt-6 rounded-xl bg-card p-8 text-center">
            <h3 className="font-bold">Nenhum NFT encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente outra busca ou ajuste seus filtros.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 min-h-11 rounded-md bg-primary px-5 font-bold text-primary-foreground"
            >
              Ver todo o catálogo
            </button>
          </div>
        ) : (
          <div
            data-testid="catalog-grid"
            className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8"
          >
            {catalog.data?.items.map((nft) => (
              <NftCard
                key={nft.id}
                {...nft}
                isFavorite={Boolean(user) && favorites.ids.has(nft.id)}
                favoriteDisabled={
                  sessionLoading ||
                  (Boolean(user) &&
                    (!favorites.query.data || favorites.mutation.isPending))
                }
                onToggleFavorite={() => {
                  if (!user) openLogin()
                  else
                    favorites.mutation.mutate({
                      id: nft.id,
                      favorite: !favorites.ids.has(nft.id),
                    })
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto">
          {catalog.data && catalog.data.totalPages > 1 && (
            <CatalogPagination
              currentPage={catalog.data.page}
              totalPages={catalog.data.totalPages}
            />
          )}
        </div>
      </div>
    </section>
  )
}
