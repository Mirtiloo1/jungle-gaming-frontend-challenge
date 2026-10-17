import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useCatalog } from '@/features/catalog/hooks'
import { normalizeCatalogSearch } from '@/features/catalog/search'
import NftCard from '@/features/catalog/components/NftCard'
import { useFavorites } from '@/features/favorites/useFavorites'
import { apiErrorMessage } from '@/lib/api-error'

export default function AccountFavorites() {
  const [page, setPage] = useState(1)
  const favorites = useFavorites()
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(favorites.ids.size / 9)),
  )
  const catalog = useCatalog(
    normalizeCatalogSearch({ favorites: true, page: currentPage }),
  )
  return (
    <section aria-label="Sua lista de interesse">
      <h1 className="text-xl font-bold">Lista de interesse</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Os NFTs que você favoritou ficam salvos aqui para explorar depois.
      </p>
      {catalog.isPending || favorites.query.isPending ? (
        <p role="status">Carregando favoritos…</p>
      ) : catalog.isError || favorites.query.isError ? (
        <div role="alert">
          <p>{apiErrorMessage(catalog.error ?? favorites.query.error)}</p>
          <button
            className="mt-3 min-h-11 text-primary underline"
            onClick={() => {
              void catalog.refetch()
              void favorites.query.refetch()
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : catalog.data?.total ? (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {catalog.data.total} NFT(s) favoritado(s)
          </p>
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-7 xl:grid-cols-3"
            data-testid="account-favorites"
          >
            {catalog.data.items
              .filter((nft) => favorites.ids.has(nft.id))
              .map((nft) => (
                <NftCard
                  key={nft.id}
                  {...nft}
                  isFavorite={true}
                  favoriteDisabled={favorites.mutation.isPending}
                  onToggleFavorite={() =>
                    favorites.mutation.mutate({ id: nft.id, favorite: false })
                  }
                />
              ))}
          </div>
          {catalog.data.totalPages > 1 && (
            <nav
              aria-label="Paginação dos favoritos"
              className="mt-8 flex items-center justify-between gap-3 text-sm"
            >
              <button
                className="min-h-11 px-3 text-primary disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <span>
                Página {currentPage} de {catalog.data.totalPages}
              </span>
              <button
                className="min-h-11 px-3 text-primary disabled:opacity-40"
                disabled={currentPage >= catalog.data.totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
          <Heart
            className="mx-auto mb-4 text-primary"
            size={30}
            aria-hidden="true"
          />
          <h2 className="font-bold">Sua lista ainda está vazia</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Toque no coração de um NFT para guardá-lo aqui.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-bold text-primary-foreground"
          >
            Explorar NFTs
          </Link>
        </div>
      )}
      {favorites.mutation.isError && (
        <p role="alert" className="mt-4 text-sm text-highlight">
          {apiErrorMessage(favorites.mutation.error)}
        </p>
      )}
    </section>
  )
}
