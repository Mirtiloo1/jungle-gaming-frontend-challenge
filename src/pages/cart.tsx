import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCatalogControls } from '@/features/catalog/useCatalogControls'
import { useCart } from '@/features/cart/context'
import type { CartLine } from '@/features/cart/types'
import { useAuth } from '@/features/auth/context'
import { useFavorites } from '@/features/favorites/useFavorites'
import RelatedNfts from '@/features/nft/components/RelatedNfts'
import QuantitySelector from '@/features/nft/components/QuantitySelector'
import type { Nft } from '@/features/catalog/types'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import NftRealtimeProvider from '@/features/nft/NftRealtimeProvider'

const primaryButton =
  'flex min-h-11 items-center justify-center rounded-sm bg-primary px-5 font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

function CartLoadingState() {
  return (
    <section
      aria-label="Carregando carrinho"
      className="grid gap-6 py-4 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[7%]"
    >
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="skeleton-shimmer h-24 rounded-2xl lg:rounded-md"
          />
        ))}
      </div>
      <div className="skeleton-shimmer h-80 rounded-[2rem] lg:rounded-md" />
    </section>
  )
}

export default function CartPage() {
  const controls = useCatalogControls()
  const cart = useCart()
  const { user, loading, openLogin } = useAuth()
  const favorites = useFavorites()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const recommendations = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: async ({ signal }) =>
      (await http.get<{ items: Nft[] }>('/cart/recommendations', { signal }))
        .data.items,
    staleTime: 30_000,
    retry: false,
  })
  useEffect(() => {
    const previous = document.title
    document.title = 'Carrinho | Kurio'
    return () => {
      document.title = previous
    }
  }, [])
  useEffect(() => {
    setMessage('')
    setError('')
    setCode('')
  }, [user?.id])

  async function update(item: CartLine, quantity: number) {
    setError('')
    setMessage('')
    try {
      await cart.updateItem({
        nftId: item.nftId,
        editionId: item.editionId,
        quantity,
      })
      if (!quantity) setMessage(`${item.name} removido do carrinho.`)
    } catch (cause) {
      setError(apiErrorMessage(cause))
    }
  }
  async function applyPromotion(value: string) {
    setError('')
    setMessage('')
    try {
      await cart.applyPromotion(value)
      setCode('')
      setMessage(value ? 'Cupom aplicado: 10% de desconto.' : 'Cupom removido.')
    } catch (cause) {
      setError(apiErrorMessage(cause))
    }
  }
  const data = cart.data
  return (
    <NftRealtimeProvider>
      <div className="hidden lg:block">
        <Header {...controls} />
      </div>
      <main className="page-container flex min-h-dvh flex-col px-7! pt-6 lg:block lg:min-h-0 lg:px-6! lg:pt-8 lg:pb-10">
        <div className="relative mb-5 flex min-h-11 items-center justify-center lg:hidden">
          <Link
            to="/"
            hash="catalogo"
            aria-label="Voltar ao mercado"
            className="absolute left-0 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1 className="px-10 text-center text-xl font-bold">
            Carrinho de NFTs
          </h1>
        </div>
        <nav
          aria-label="Caminho da página"
          className="mb-3 hidden flex-wrap gap-2 text-sm font-bold lg:flex"
        >
          <Link to="/">Início</Link>
          <span aria-hidden="true">/</span>
          <Link to="/" hash="catalogo">
            Mercado
          </Link>
          <span aria-hidden="true">/</span>
          <h1 aria-current="page">Carrinho</h1>
        </nav>
        <div
          role="status"
          aria-live="polite"
          className="text-sm text-highlight"
        >
          {message}
        </div>
        {error && (
          <p role="alert" className="my-3 text-sm text-highlight">
            {error}
          </p>
        )}
        {cart.loading ? (
          <CartLoadingState />
        ) : cart.loadError ? (
          <div role="alert" className="py-16">
            <p>{apiErrorMessage(cart.loadError)}</p>
            <button
              type="button"
              onClick={cart.refetch}
              className="mt-4 min-h-11 text-primary underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : !data?.items.length ? (
          <section className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart
              size={40}
              className="text-primary"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground">
              Explore a coleção e escolha seu próximo NFT.
            </p>
            <Link to="/" hash="catalogo" className={primaryButton}>
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-1 lg:grid lg:flex-none lg:items-start lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[7%]">
            <section aria-label="Itens do carrinho" aria-busy={cart.updating}>
              <div
                aria-hidden="true"
                className="mb-3 hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr_44px] gap-3 border-b border-border pb-2 font-bold lg:grid"
              >
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span />
              </div>
              <ul className="space-y-5 lg:space-y-3">
                {data.items.map((item) => (
                  <li
                    key={`${item.nftId}-${item.editionId}`}
                    aria-label={`${item.name}, edição ${item.edition}`}
                    className="overflow-hidden rounded-2xl bg-card lg:overflow-visible lg:rounded-none"
                  >
                    <div className="relative flex min-h-25 lg:hidden">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: item.nftId }}
                        search={{ edition: item.editionId }}
                        aria-label={`Ver ${item.name}`}
                        className="w-[clamp(4.5rem,24vw,6.25rem)] shrink-0"
                      >
                        <img
                          src={item.image}
                          alt=""
                          width={100}
                          height={100}
                          className="h-full min-h-25 w-full object-cover"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-2 pl-3">
                        <Link
                          to="/nfts/$nftId"
                          params={{ nftId: item.nftId }}
                          search={{ edition: item.editionId }}
                          className="pr-10 text-sm leading-snug font-bold"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 pr-10 text-xs text-muted-foreground">
                          Edição: {item.edition}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-1 gap-y-1">
                          <p className="text-lg font-bold text-highlight">
                            {item.total} ETH
                          </p>
                          <div className="[&_button]:size-6 [&_button]:border [&_button]:border-border [&_button]:bg-secondary/40 [&_button]:text-foreground [&_input]:h-8 [&_input]:w-6 [&_input]:text-sm [&_svg]:size-3.5">
                            <QuantitySelector
                              quantity={item.quantity}
                              maximum={item.maximum}
                              disabled={cart.updating}
                              onChange={(quantity) =>
                                void update(item, quantity)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remover ${item.name}, edição ${item.edition}`}
                        disabled={cart.updating}
                        onClick={() => void update(item, 0)}
                        className="group absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-highlight focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary active:scale-95 disabled:opacity-40"
                      >
                        <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background/35 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10">
                          <Trash2
                            size={14}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                    </div>
                    <div className="hidden items-center gap-3 pr-3 lg:grid lg:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr_44px]">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: item.nftId }}
                        search={{ edition: item.editionId }}
                        className="col-span-2 flex min-w-0 items-center gap-4 lg:col-span-1"
                      >
                        <img
                          src={item.image}
                          alt=""
                          width={70}
                          height={70}
                          className="size-[70px] shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <h2 className="text-sm font-bold">{item.name}</h2>
                          <p className="text-xs text-muted-foreground">
                            ID do token: {item.tokenId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Edição {item.edition}
                          </p>
                        </div>
                      </Link>
                      <p className="text-sm font-bold text-muted-foreground">
                        <span className="font-normal lg:hidden">Preço: </span>
                        {item.price} ETH
                      </p>
                      <div className="row-span-2 lg:row-span-1 [&_button]:h-8 [&_button]:w-6 [&_input]:w-7 [&_input]:text-base">
                        <QuantitySelector
                          quantity={item.quantity}
                          maximum={item.maximum}
                          disabled={cart.updating}
                          onChange={(quantity) => void update(item, quantity)}
                        />
                      </div>
                      <p className="text-sm font-bold text-highlight">
                        <span className="font-normal lg:hidden">Total: </span>
                        {item.total} ETH
                      </p>
                      <button
                        type="button"
                        aria-label={`Remover ${item.name}, edição ${item.edition}`}
                        disabled={cart.updating}
                        onClick={() => void update(item, 0)}
                        className="col-span-2 flex min-h-11 items-center justify-end text-muted-foreground transition hover:text-highlight disabled:opacity-40 lg:col-span-1 lg:justify-center"
                      >
                        <Trash2
                          size={20}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {data.warnings.map((warning) => (
                <p
                  key={warning}
                  role="status"
                  className="mt-3 text-sm text-highlight"
                >
                  {warning}
                </p>
              ))}
            </section>
            <aside
              aria-labelledby="cart-summary-title"
              className="-mx-7 rounded-t-[2.5rem] bg-card px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:mx-0 lg:rounded-none lg:bg-transparent lg:p-0"
            >
              <h2
                id="cart-summary-title"
                className="sr-only lg:not-sr-only lg:border-b lg:border-border lg:pb-2 lg:text-lg lg:font-bold"
              >
                Resumo da carteira
              </h2>
              <form
                className="lg:mt-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  void applyPromotion(code)
                }}
              >
                <label
                  htmlFor="promotion"
                  className="sr-only lg:not-sr-only lg:mb-2 lg:block lg:text-sm lg:font-bold"
                >
                  Código promocional
                </label>
                <div className="flex min-w-0 rounded-full border border-border transition-colors has-[input:focus]:border-highlight lg:rounded-none lg:border-0">
                  <input
                    id="promotion"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                    maxLength={30}
                    disabled={cart.updating}
                    placeholder="Digite o código promocional..."
                    className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-highlight focus-visible:outline-none lg:h-11 lg:rounded-l-sm lg:rounded-r-none lg:border lg:border-border lg:px-2"
                  />
                  <button
                    type="submit"
                    disabled={cart.updating || !code.trim()}
                    className={cn(
                      primaryButton,
                      'shrink-0 rounded-full bg-linear-to-r from-[#88572f] to-primary px-4 text-sm text-foreground lg:rounded-l-none lg:rounded-r-sm lg:bg-primary lg:bg-none lg:px-5 lg:text-primary-foreground',
                    )}
                  >
                    Aplicar
                  </button>
                </div>
              </form>
              {data.promotion && (
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-highlight">
                  <span>{data.promotion} aplicado</span>
                  <button
                    type="button"
                    disabled={cart.updating}
                    onClick={() => void applyPromotion('')}
                    className="min-h-11 underline"
                  >
                    Remover cupom
                  </button>
                </div>
              )}
              <dl className="mt-3 space-y-3 text-sm lg:mt-6">
                <div className="flex justify-between gap-3">
                  <dt>Subtotal</dt>
                  <dd data-testid="cart-subtotal">{data.subtotal} ETH</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Desconto do lançamento</dt>
                  <dd data-testid="cart-discount">(−) {data.discount} ETH</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Taxa de rede</dt>
                  <dd>{data.networkFee} ETH</dd>
                </div>
              </dl>
              <p className="mt-0 text-right text-xs text-highlight lg:mt-3">
                Taxa estimada
              </p>
              <p className="mt-3 flex justify-between gap-3 text-lg font-bold lg:mt-6">
                <span>Total</span>
                <span data-testid="cart-total" className="text-highlight">
                  {data.total} ETH
                </span>
              </p>
              <button
                type="button"
                disabled={cart.updating}
                onClick={() => void navigate({ to: '/pagamento' })}
                className={cn(
                  primaryButton,
                  'mt-7 min-h-15 w-full rounded-full bg-linear-to-r from-primary to-[#b57944] text-base lg:mt-5 lg:min-h-11 lg:rounded-sm lg:bg-primary lg:bg-none lg:text-sm',
                )}
              >
                Conectar e finalizar
              </button>
              <Link
                to="/"
                hash="catalogo"
                className="mt-1 hidden min-h-11 items-center justify-center text-sm text-highlight hover:underline lg:flex"
              >
                Continuar explorando
              </Link>
            </aside>
          </div>
        )}
        <div className="hidden lg:block">
          {recommendations.isError ? (
            <p className="mt-16 text-sm text-muted-foreground">
              Não foi possível carregar as sugestões.{' '}
              <button
                type="button"
                onClick={() => void recommendations.refetch()}
                className="min-h-11 text-primary underline"
              >
                Tentar novamente
              </button>
            </p>
          ) : (
            recommendations.data && (
              <RelatedNfts
                title="Colecionadores também viram"
                items={recommendations.data}
                favorites={favorites.ids}
                favoriteDisabled={
                  loading ||
                  (Boolean(user) &&
                    (!favorites.query.data || favorites.mutation.isPending))
                }
                onFavorite={(id) => {
                  if (!user) openLogin()
                  else
                    favorites.mutation.mutate({
                      id,
                      favorite: !favorites.ids.has(id),
                    })
                }}
              />
            )
          )}
          {favorites.mutation.isError && (
            <p role="alert" className="mt-3 text-highlight">
              {apiErrorMessage(favorites.mutation.error)}
            </p>
          )}
        </div>
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </NftRealtimeProvider>
  )
}
