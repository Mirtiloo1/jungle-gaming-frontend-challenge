import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import {
  ArrowLeft,
  Copy,
  Heart,
  Linkedin,
  Mail,
  ShoppingCart,
  Star,
  Twitter,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCatalogControls } from '@/features/catalog/useCatalogControls'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/context'
import { useCart } from '@/features/cart/context'
import { fetchNftDetail, fetchRelatedNfts } from '@/features/nft/api'
import type { NftDetail } from '@/features/nft/types'
import NftGallery from '@/features/nft/components/NftGallery'
import QuantitySelector from '@/features/nft/components/QuantitySelector'
import NftDetailsTabs from '@/features/nft/components/NftDetailsTabs'
import RelatedNfts from '@/features/nft/components/RelatedNfts'
import { apiErrorMessage } from '@/lib/api-error'
import { ethToUnits } from '@/features/catalog/search'
import { unitsToEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import NftRealtimeProvider from '@/features/nft/NftRealtimeProvider'

function NftDetailContent({ nft }: { nft: NftDetail }) {
  const { edition: requestedEdition } = useSearch({ from: '/nfts/$nftId' })
  const navigate = useNavigate({ from: '/nfts/$nftId' })
  const edition =
    nft.editions.find((item) => item.id === requestedEdition) ??
    nft.editions.find((item) => item.id === nft.defaultEditionId)!
  const [quantity, setQuantity] = useState(1)
  const [purchaseError, setPurchaseError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const favorites = useFavorites()
  const { user, loading, openLogin } = useAuth()
  const cart = useCart()
  const maximum = Math.min(edition.available, edition.maxPerOrder)
  const related = useQuery({
    queryKey: ['nft-related', nft.id],
    queryFn: ({ signal }) => fetchRelatedNfts(nft.id, signal),
    staleTime: 30_000,
    retry: false,
  })
  useEffect(() => {
    setQuantity(1)
    setPurchaseError('')
  }, [edition.id])
  useEffect(
    () => setQuantity((current) => Math.min(current, Math.max(1, maximum))),
    [maximum],
  )
  const isFavorite = Boolean(user) && favorites.ids.has(nft.id)
  const favoriteDisabled =
    loading ||
    (Boolean(user) && (!favorites.query.data || favorites.mutation.isPending))

  function toggleFavorite(id: string) {
    if (!user) openLogin()
    else favorites.mutation.mutate({ id, favorite: !favorites.ids.has(id) })
  }
  async function addToCart() {
    if (cart.adding || maximum < 1) return
    setPurchaseError('')
    try {
      await cart.addItem({ nftId: nft.id, editionId: edition.id, quantity })
      cart.openCart()
    } catch (error) {
      setPurchaseError(apiErrorMessage(error))
    }
  }
  const favoriteButton = (compact: boolean) => (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `Remover ${nft.name} dos favoritos`
          : `Favoritar ${nft.name}`
      }
      aria-pressed={isFavorite}
      disabled={favoriteDisabled}
      onClick={() => toggleFavorite(nft.id)}
      className={
        compact
          ? 'flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-primary disabled:opacity-50'
          : 'inline-flex min-h-11 items-center gap-2 rounded-md border border-primary px-3 text-sm font-bold text-primary disabled:opacity-50'
      }
    >
      <Heart
        size={compact ? 18 : 22}
        fill={isFavorite ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
      {!compact && (isFavorite ? 'Favoritado' : 'Favoritar')}
    </button>
  )
  const shareUrl = new URL(
    `/nfts/${encodeURIComponent(nft.id)}?edition=${edition.id}`,
    window.location.origin,
  ).href
  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareMessage('Link copiado.')
    } catch {
      setShareMessage('Não foi possível copiar o link neste navegador.')
    }
  }

  return (
    <NftRealtimeProvider>
      <main className="pb-52 lg:page-container lg:pb-0">
        <nav
          aria-label="Caminho de navegação"
          className="mt-8 mb-3 hidden items-center gap-2 text-sm font-bold lg:flex"
        >
          <Link to="/" search={true}>
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/" search={true} hash="catalogo">
            Mercado
          </Link>
        </nav>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] lg:gap-8">
          <div className="bg-linear-to-b from-card to-background lg:bg-none">
            <div className="flex items-center justify-between px-6 pt-5 pb-2 lg:hidden">
              <Link
                to="/"
                search={true}
                hash="catalogo"
                aria-label="Voltar ao catálogo"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              {favoriteButton(true)}
            </div>
            <div className="px-6 lg:px-0">
              <NftGallery nft={nft} />
            </div>
          </div>

          <section
            aria-labelledby="nft-title"
            className="relative -mt-4 rounded-t-[32px] bg-card px-6 py-8 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-0"
          >
            <div className="flex items-center justify-between gap-3">
              <h1 id="nft-title" className="text-xl font-bold lg:text-3xl">
                {nft.name}
              </h1>
              <p
                aria-label={`${nft.rating} de 5, ${nft.reviewCount} avaliações`}
                className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 py-1 text-xs lg:hidden"
              >
                <Star
                  size={14}
                  fill="currentColor"
                  className="text-primary"
                  aria-hidden="true"
                />
                {nft.rating}{' '}
                <span className="text-muted-foreground">
                  ({nft.reviewCount})
                </span>
              </p>
            </div>
            <div className="mt-3 hidden flex-wrap items-center justify-between gap-2 border-b border-border pb-2 lg:flex">
              <p
                data-testid="nft-edition-price"
                className="text-2xl font-bold text-highlight"
              >
                {edition.price} ETH
              </p>
              <p
                aria-label={`${nft.rating} de 5, ${nft.reviewCount} avaliações de colecionadores`}
                className="flex flex-wrap items-center gap-2 text-xs"
              >
                <span className="flex text-primary" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={14}
                      fill="currentColor"
                      className={index === 4 ? 'text-muted-foreground' : ''}
                    />
                  ))}
                </span>
                {nft.reviewCount} avaliações de colecionadores
              </p>
            </div>
            <h2 className="mt-3 hidden text-sm font-bold lg:block">
              Sobre este NFT:
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground lg:mt-2">
              <span className="lg:hidden">{nft.mobileDescription}</span>
              <span className="hidden lg:inline">{nft.description}</span>
            </p>
            <fieldset className="mt-3">
              <legend className="mb-2 text-sm font-bold">Edição:</legend>
              <div className="flex flex-wrap gap-2">
                {nft.editions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Edição ${item.label}${item.available === 0 ? ', esgotada' : ''}`}
                    aria-pressed={item.id === edition.id}
                    onClick={() =>
                      void navigate({
                        search: (previous) => ({
                          ...previous,
                          edition: item.id,
                        }),
                        replace: true,
                      })
                    }
                    className={cn(
                      'min-h-8 rounded-full border px-2 text-sm',
                      item.id === edition.id
                        ? 'border-primary text-highlight'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {requestedEdition &&
              !nft.editions.some((item) => item.id === requestedEdition) && (
                <p role="alert" className="mt-2 text-sm text-highlight">
                  Edição não encontrada. Exibindo a edição {edition.label}.
                </p>
              )}
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {maximum > 0
                ? `Até ${maximum} unidades por pedido nesta edição.`
                : 'Esta edição está esgotada. Escolha outra edição.'}
            </p>
            <div className="mt-3 hidden flex-wrap items-center justify-between gap-4 lg:flex">
              <QuantitySelector
                quantity={quantity}
                maximum={maximum}
                disabled={maximum === 0 || cart.adding}
                onChange={setQuantity}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={maximum === 0 || cart.adding}
                  onClick={() => void addToCart()}
                  className="min-h-11 min-w-32 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cart.adding ? 'Adicionando…' : 'COMPRAR'}
                </button>
                {favoriteButton(false)}
              </div>
            </div>
            {purchaseError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {purchaseError}
              </p>
            )}
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
                  onClick={() => void favorites.query.refetch()}
                  className="underline"
                >
                  Tentar favoritos novamente
                </button>
              </p>
            )}
            <p className="sr-only" aria-live="polite">
              {favorites.mutation.isSuccess ? 'Favoritos atualizados.' : ''}
            </p>
            <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div>
                <dt className="inline">ID do token: </dt>
                <dd className="inline">{nft.tokenId}</dd>
              </div>
              <div>
                <dt className="inline">Coleção: </dt>
                <dd className="inline">{nft.collectionName}</dd>
              </div>
              <div>
                <dt className="inline">Atributos: </dt>
                <dd className="inline">{nft.attributes.join(', ')}</dd>
              </div>
            </dl>
            <div className="mt-4 hidden flex-wrap items-center gap-2 lg:flex">
              <h2 className="text-sm font-bold">Compartilhar este NFT:</h2>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no LinkedIn"
                className="flex size-8 items-center justify-center rounded-sm"
              >
                <Linkedin size={16} aria-hidden="true" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(shareUrl)}`}
                aria-label="Compartilhar por e-mail"
                className="flex size-8 items-center justify-center rounded-sm"
              >
                <Mail size={16} aria-hidden="true" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(nft.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Twitter"
                className="flex size-8 items-center justify-center rounded-sm"
              >
                <Twitter size={16} aria-hidden="true" />
              </a>
              <button
                type="button"
                aria-label="Copiar link do NFT"
                onClick={() => void copyShareLink()}
                className="flex size-8 items-center justify-center rounded-sm"
              >
                <Copy size={16} aria-hidden="true" />
              </button>
            </div>
            {shareMessage && (
              <p role="status" className="mt-2 text-xs text-muted-foreground">
                {shareMessage}
              </p>
            )}
          </section>
        </div>

        <NftDetailsTabs nft={nft} />
        {related.isPending && (
          <div
            aria-label="Carregando NFTs relacionados"
            className="skeleton-shimmer mx-6 mt-12 h-60 rounded-xl lg:mx-0"
          />
        )}
        {related.isError && (
          <p role="alert" className="mt-8 px-6 text-sm text-destructive">
            Não foi possível carregar os NFTs relacionados.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void related.refetch()}
            >
              Tentar novamente
            </button>
          </p>
        )}
        {related.data && (
          <RelatedNfts
            items={related.data.items}
            favorites={user ? favorites.ids : new Set()}
            onFavorite={toggleFavorite}
            favoriteDisabled={favoriteDisabled}
          />
        )}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <section
        aria-label="Comprar NFT"
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] bg-card px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_#140d0a66] lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Qtd.</span>
            <QuantitySelector
              quantity={quantity}
              maximum={maximum}
              disabled={maximum === 0 || cart.adding}
              onChange={setQuantity}
            />
          </div>
          <p
            aria-label="Total selecionado"
            className="text-lg font-bold text-highlight"
          >
            {unitsToEth(ethToUnits(edition.price) * BigInt(quantity))} ETH
          </p>
        </div>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            disabled={maximum === 0 || cart.adding}
            onClick={() => void addToCart()}
            className="min-h-14 flex-1 rounded-full bg-linear-to-r from-primary to-primary/80 px-5 font-bold text-primary-foreground disabled:opacity-50"
          >
            {cart.adding ? 'Adicionando…' : 'Comprar NFT'}
          </button>
          <button
            type="button"
            aria-label="Adicionar NFT ao carrinho"
            disabled={maximum === 0 || cart.adding}
            onClick={() => void addToCart()}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/50 text-muted-foreground disabled:opacity-50"
          >
            <ShoppingCart size={22} fill="currentColor" aria-hidden="true" />
          </button>
        </div>
      </section>
    </NftRealtimeProvider>
  )
}

export default function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const controls = useCatalogControls()
  const query = useQuery({
    queryKey: ['nft', nftId],
    queryFn: ({ signal }) => fetchNftDetail(nftId, signal),
    staleTime: 30_000,
    retry: false,
  })
  useEffect(() => {
    if (!query.data) return
    const previousTitle = document.title
    document.title = `${query.data.name} | Kurio`
    return () => {
      document.title = previousTitle
    }
  }, [query.data])
  return (
    <>
      <div className="hidden lg:block">
        <Header {...controls} />
      </div>
      {query.isPending ? (
        <main
          className="page-container py-10"
          aria-label="Carregando detalhes do NFT"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="skeleton-shimmer aspect-square rounded-3xl" />
            <div className="space-y-6">
              <div className="skeleton-shimmer h-10 rounded" />
              <div className="skeleton-shimmer h-48 rounded-xl" />
            </div>
          </div>
        </main>
      ) : query.isError ? (
        <main className="page-container py-20 text-center">
          <h1 className="text-2xl font-bold">
            {isAxiosError(query.error) && query.error.response?.status === 404
              ? 'NFT não encontrado'
              : 'Não foi possível carregar este NFT'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {apiErrorMessage(query.error)}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              search={true}
              hash="catalogo"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
            >
              Voltar ao catálogo
            </Link>
            {!(
              isAxiosError(query.error) && query.error.response?.status === 404
            ) && (
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="min-h-11 rounded-md border border-primary px-5 text-primary"
              >
                Tentar novamente
              </button>
            )}
          </div>
        </main>
      ) : (
        <NftDetailContent key={nftId} nft={query.data} />
      )}
    </>
  )
}
