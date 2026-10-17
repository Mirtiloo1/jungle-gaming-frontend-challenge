import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog, DropdownMenu } from 'radix-ui'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  EllipsisVertical,
  LoaderCircle,
  Wallet as WalletIcon,
  X,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCatalogControls } from '@/features/catalog/useCatalogControls'
import { useAuth } from '@/features/auth/context'
import type { SessionUser } from '@/features/auth/context'
import { useCheckoutFlow } from '@/features/checkout/useCheckoutFlow'
import { networkLabels, providerLabels } from '@/features/checkout/types'
import type { Provider } from '@/features/checkout/types'
import type { CartResponse } from '@/features/cart/types'
import ProfileFields, { fieldClass } from '@/features/checkout/ProfileFields'
import Receipt from '@/features/checkout/Receipt'
import WalletDialog from '@/features/checkout/WalletDialog'
import DemoScenarios from '@/features/checkout/DemoScenarios'
import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

const primaryButton =
  'flex min-h-12 items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

function Totals({ summary }: { summary: CartResponse }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd>{summary.subtotal} ETH</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Desconto do lançamento</dt>
        <dd>− {summary.discount} ETH</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Taxa de rede</dt>
        <dd>{summary.networkFee} ETH</dd>
      </div>
      <div className="text-right text-xs text-highlight">Taxa estimada</div>
      <div className="flex justify-between gap-3 border-t border-border pt-3 text-lg font-bold">
        <dt>Total</dt>
        <dd className="text-highlight" data-testid="checkout-total">
          {summary.total} ETH
        </dd>
      </div>
    </dl>
  )
}
function CheckoutContent({ user }: { user: SessionUser }) {
  const flow = useCheckoutFlow(user)
  const [walletDialog, setWalletDialog] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [couponOpen, setCouponOpen] = useState(false)
  const [coupon, setCoupon] = useState('')
  const submitButton = useRef<HTMLButtonElement>(null)
  const busy =
    flow.preparation.isPending ||
    flow.connection.isPending ||
    flow.submit.isPending
  useEffect(() => {
    if (flow.quote) setReviewOpen(true)
    else setReviewOpen(false)
  }, [flow.quote])
  useEffect(() => {
    if (flow.order.data?.status === 'confirmed') setReceiptOpen(true)
  }, [flow.order.data?.status])
  useEffect(() => {
    const first = Object.keys(flow.fields)[0]
    if (!first) return
    setProfileExpanded(true)
    const frame = requestAnimationFrame(() =>
      document.getElementById(first)?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [flow.fields])
  const scenarios = <DemoScenarios />
  if (flow.orderId) {
    const order = flow.order.data
    return (
      <section
        data-testid="order-status"
        data-socket-version={flow.socketVersion}
        className="mx-auto flex min-h-[65dvh] max-w-xl flex-col justify-center py-8 text-center"
      >
        {!order ? (
          flow.order.isError ? (
            <>
              <h2 className="text-xl font-bold">
                Não foi possível consultar o pedido
              </h2>
              <p role="alert" className="mt-3 text-muted-foreground">
                {apiErrorMessage(flow.order.error)}
              </p>
              <button
                type="button"
                onClick={() => void flow.order.refetch()}
                className={`${primaryButton} mt-6`}
              >
                Consultar novamente
              </button>
            </>
          ) : (
            <p role="status" className="skeleton-shimmer rounded-xl py-20">
              Recuperando pedido…
            </p>
          )
        ) : order.status === 'pending' ? (
          <>
            <LoaderCircle
              size={44}
              className="mx-auto animate-spin text-primary"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-xl font-bold">
              Pagamento em processamento
            </h2>
            <p
              role="status"
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
            >
              Aguardando a confirmação da carteira. Você pode recarregar esta
              página; a mesma compra será recuperada.
            </p>
            <p className="mt-3 break-all text-xs text-muted-foreground">
              Pedido: {order.id}
            </p>
          </>
        ) : order.status === 'declined' ? (
          <>
            <h2 className="text-xl font-bold">Pagamento recusado</h2>
            <p role="alert" className="mt-3 text-sm text-muted-foreground">
              {order.reason}
            </p>
            <button
              type="button"
              onClick={flow.resetOrder}
              className={`${primaryButton} mt-6`}
            >
              Tentar novamente
            </button>
            {scenarios}
          </>
        ) : (
          <>
            <CheckCircle2
              size={44}
              className="mx-auto text-primary"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-xl font-bold">Compra confirmada</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Seu recibo está disponível. Esta é uma transação de demonstração.
            </p>
            <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              className={`${primaryButton} mt-6`}
            >
              Ver recibo
            </button>
            <Receipt
              order={order}
              open={receiptOpen}
              onOpenChange={setReceiptOpen}
            />
          </>
        )}
        <Link
          to="/"
          hash="catalogo"
          className="mt-5 flex min-h-11 items-center justify-center text-sm text-primary hover:underline"
        >
          Continuar explorando
        </Link>
      </section>
    )
  }
  if (flow.attempt && !flow.submit.isPending)
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <h2 className="text-xl font-bold">Recuperando sua tentativa</h2>
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Conferindo se o pedido já foi registrado para evitar uma compra
          duplicada.
        </p>
        {flow.recovery.isError && (
          <>
            <p role="alert" className="mt-4 text-sm text-highlight">
              {apiErrorMessage(flow.recovery.error)}
            </p>
            <button
              type="button"
              onClick={() => void flow.recovery.refetch()}
              className="mt-4 min-h-11 px-4 text-primary underline"
            >
              Consultar novamente
            </button>
            <button
              type="button"
              onClick={flow.retryAttempt}
              className={`${primaryButton} mt-3 w-full`}
            >
              Reenviar mesma tentativa
            </button>
          </>
        )}
      </section>
    )
  if (flow.setup.isPending || flow.cart.loading)
    return (
      <div
        aria-label="Carregando pagamento"
        className="grid gap-6 py-6 lg:grid-cols-[1.8fr_1fr]"
      >
        <div className="skeleton-shimmer h-80 rounded-xl" />
        <div className="skeleton-shimmer h-80 rounded-xl" />
      </div>
    )
  if (flow.setup.isError || flow.cart.loadError)
    return (
      <section className="py-16">
        <h2 className="text-xl font-bold">
          Não foi possível carregar o pagamento
        </h2>
        <p role="alert" className="mt-4 text-sm text-muted-foreground">
          {apiErrorMessage(flow.setup.error ?? flow.cart.loadError)}
        </p>
        <button
          type="button"
          onClick={() => {
            void flow.setup.refetch()
            flow.cart.refetch()
          }}
          className={`${primaryButton} mt-6`}
        >
          Tentar novamente
        </button>
        {scenarios}
      </section>
    )
  if (!flow.cart.data?.items.length)
    return (
      <section className="py-20 text-center">
        <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
        <Link
          to="/"
          hash="catalogo"
          className={`${primaryButton} mx-auto mt-6 max-w-xs`}
        >
          Explorar NFTs
        </Link>
      </section>
    )
  if (!flow.wallet || !flow.profile || !flow.setup.data)
    return <p role="status">Carregando carteiras…</p>
  const summary = flow.cart.data
  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (flow.connected) flow.preparation.mutate()
          else flow.connection.mutate(true)
        }}
        className="flex min-h-[calc(100dvh-7rem)] flex-col lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start lg:gap-8"
      >
        <div
          className={cn(
            'lg:block',
            profileExpanded ? 'order-2 mt-5 lg:order-none lg:mt-0' : 'hidden',
          )}
        >
          <fieldset disabled={busy} className="min-w-0">
            <ProfileFields
              profile={flow.profile}
              onChange={flow.setProfile}
              wallet={flow.wallet}
              wallets={flow.setup.data.wallets}
              selectWallet={flow.selectWallet}
              provider={flow.provider}
              setProvider={flow.setProvider}
              errors={flow.fields}
              changeWallet={() => setWalletDialog(true)}
            />
          </fieldset>
        </div>
        <div className="contents lg:block">
          <section className="hidden lg:block" aria-label="Revisão dos NFTs">
            <h2 className="mb-2 text-lg font-bold">Seus NFTs</h2>
            <div className="mb-3 flex justify-between border-b border-border pb-2 text-sm">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            <ul className="space-y-3">
              {summary.items.map((item) => (
                <li
                  key={`${item.nftId}-${item.editionId}`}
                  className="flex items-center gap-2 bg-card pr-3"
                >
                  <img
                    src={item.image}
                    width={70}
                    height={70}
                    alt=""
                    className="size-17 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      ID do token: {item.tokenId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Edição {item.edition} · × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-highlight">
                    {item.total} ETH
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              aria-expanded={couponOpen}
              onClick={() => setCouponOpen((value) => !value)}
              className="flex min-h-11 w-full items-center justify-center text-xs text-primary hover:underline"
            >
              Tem um código promocional? Aplique aqui
            </button>
            {couponOpen && (
              <div className="mb-4 flex gap-2">
                <label className="sr-only" htmlFor="checkout-coupon">
                  Código promocional
                </label>
                <input
                  id="checkout-coupon"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  maxLength={30}
                  className={fieldClass}
                />
                <button
                  type="button"
                  disabled={!coupon.trim() || flow.cart.updating}
                  onClick={async () => {
                    try {
                      await flow.cart.applyPromotion(coupon)
                      setCoupon('')
                      flow.setMessage('Cupom aplicado.')
                      flow.setQuote(null)
                    } catch (error) {
                      flow.setMessage(apiErrorMessage(error))
                    }
                  }}
                  className={primaryButton}
                >
                  Aplicar
                </button>
                {summary.promotion && (
                  <button
                    type="button"
                    disabled={flow.cart.updating}
                    onClick={async () => {
                      try {
                        await flow.cart.applyPromotion('')
                        flow.setQuote(null)
                      } catch (error) {
                        flow.setMessage(apiErrorMessage(error))
                      }
                    }}
                    className="min-h-11 text-xs text-primary"
                  >
                    Remover cupom
                  </button>
                )}
              </div>
            )}
            <Totals summary={summary} />
          </section>
          <section className="lg:mt-4" aria-label="Carteiras cadastradas">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <h2 className="text-base font-bold">
                {flow.connected ? 'Carteira conectada' : 'Sua carteira'}
              </h2>
              <button
                type="button"
                onClick={() => setWalletDialog(true)}
                disabled={busy}
                className="min-h-11 text-sm font-bold text-primary hover:underline"
              >
                Trocar carteira
              </button>
            </div>
            <div
              role="radiogroup"
              aria-label="Carteira cadastrada"
              className="space-y-5 lg:hidden"
            >
              {flow.setup.data.wallets.map((wallet) => (
                <div key={wallet.id} className="relative">
                  <button
                    role="radio"
                    type="button"
                    aria-checked={flow.walletId === wallet.id}
                    disabled={busy}
                    onClick={() => flow.selectWallet(wallet.id)}
                    className={cn(
                      'flex min-h-23 w-full items-center gap-4 rounded-2xl bg-card py-3 pr-10 pl-5 text-left lg:min-h-16 lg:rounded-md lg:border lg:border-border',
                      flow.walletId === wallet.id && 'lg:border-primary',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-4 shrink-0 rounded-full border border-border',
                        flow.walletId === wallet.id &&
                          'border-primary bg-primary ring-2 ring-card ring-inset',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block font-bold">{wallet.name}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {wallet.ens ||
                          `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}`}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Rede {networkLabels[wallet.network]}
                      </span>
                    </span>
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`Opções da carteira ${wallet.name}`}
                        className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
                      >
                        <EllipsisVertical size={18} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        className="z-[80] rounded-md border border-border bg-card p-1 text-sm shadow-xl"
                      >
                        <DropdownMenu.Item
                          onSelect={() => flow.selectWallet(wallet.id)}
                          className="flex min-h-11 cursor-pointer items-center px-3 outline-none data-highlighted:bg-secondary"
                        >
                          Usar esta carteira
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                wallet.address,
                              )
                              flow.setMessage('Endereço copiado.')
                            } catch {
                              flow.setMessage(
                                'Não foi possível copiar o endereço.',
                              )
                            }
                          }}
                          className="flex min-h-11 cursor-pointer items-center px-3 outline-none data-highlighted:bg-secondary"
                        >
                          Copiar endereço
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setWalletDialog(true)}
              className="hidden min-h-9 text-xs text-primary lg:inline-flex lg:items-center lg:pr-4"
            >
              Trocar carteira
            </button>
            {flow.connected && (
              <button
                type="button"
                disabled={busy}
                onClick={() => flow.connection.mutate(false)}
                className="mt-1 min-h-9 text-xs text-muted-foreground hover:text-primary"
              >
                Desconectar carteira
              </button>
            )}
          </section>
          <fieldset disabled={busy} className="mt-5 min-w-0">
            <legend className="mb-4 w-full text-base font-bold lg:text-center">
              Carteira e rede
            </legend>
            <div className="space-y-4">
              {(Object.entries(providerLabels) as [Provider, string][]).map(
                ([id, label]) => (
                  <label
                    key={id}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition-colors hover:border-primary/60 has-focus-visible:border-primary has-focus-visible:ring-2 has-focus-visible:ring-primary/25 has-disabled:cursor-wait has-disabled:opacity-60 lg:min-h-12 lg:rounded-sm lg:bg-transparent',
                      flow.provider === id
                        ? 'border-primary lg:bg-primary/5'
                        : 'border-transparent lg:border-border',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary/40 text-primary lg:hidden"
                    >
                      {id === 'walletconnect' ? (
                        'W'
                      ) : id === 'metamask' ? (
                        'M'
                      ) : (
                        <WalletIcon size={21} />
                      )}
                    </span>
                    <span className="flex-1 text-sm">{label}</span>
                    <input
                      type="radio"
                      name="payment-provider"
                      value={id}
                      checked={flow.provider === id}
                      onChange={() => flow.setProvider(id)}
                      className="order-last size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-primary/70 bg-transparent checked:border-primary checked:bg-[radial-gradient(circle,var(--primary)_0_4px,transparent_4.5px)] focus-visible:outline-none disabled:cursor-wait lg:order-first"
                    />
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <p className="mt-4 flex justify-end gap-5 text-lg font-bold lg:hidden">
            <span>Total:</span>
            <span
              className="text-highlight"
              data-testid="checkout-total-mobile"
            >
              {summary.total} ETH
            </span>
          </p>
          <button
            type="button"
            onClick={() => setProfileExpanded((value) => !value)}
            aria-expanded={profileExpanded}
            className="mt-3 flex min-h-11 items-center justify-between gap-2 text-xs text-muted-foreground lg:hidden"
          >
            Dados do colecionador <ChevronDown size={16} aria-hidden="true" />
          </button>
          <div className="order-3 mt-auto pt-4 lg:mt-0 lg:pt-6">
            {flow.message && (
              <p
                role="alert"
                className="mb-4 text-sm leading-relaxed text-highlight"
              >
                {flow.message}
              </p>
            )}
            <button
              type="submit"
              ref={submitButton}
              disabled={busy || flow.cart.updating}
              className={cn(
                primaryButton,
                'min-h-15 w-full rounded-full bg-linear-to-r from-primary to-[#b57944] text-base lg:min-h-11 lg:rounded-md lg:bg-none lg:text-sm',
              )}
            >
              {flow.submit.isPending
                ? 'Enviando pedido…'
                : flow.preparation.isPending
                  ? 'Conferindo valores…'
                  : flow.connection.isPending
                    ? 'Conectando…'
                    : flow.connected
                      ? 'Confirmar compra'
                      : 'Conectar carteira'}
            </button>
            {scenarios}
          </div>
        </div>
      </form>
      <WalletDialog
        open={walletDialog}
        onOpenChange={setWalletDialog}
        wallets={flow.setup.data.wallets}
        onSelect={flow.selectWallet}
        onAdded={flow.addWallet}
      />
      <Dialog.Root
        open={reviewOpen && !!flow.quote && !flow.orderId}
        onOpenChange={(value) => {
          if (!flow.submit.isPending) {
            setReviewOpen(value)
            if (!value) flow.setQuote(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/70" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              submitButton.current?.focus()
            }}
            className="fixed top-1/2 left-1/2 z-[100] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6"
          >
            <Dialog.Title className="pr-8 text-xl font-bold">
              Revisar pagamento
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm text-muted-foreground">
              Confira a cotação e o destino antes de enviar o pedido simulado.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                disabled={flow.submit.isPending}
                type="button"
                aria-label="Fechar revisão"
                className="absolute top-1 right-1 flex size-11 items-center justify-center"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
            <p className="mt-4 text-sm">
              {providerLabels[flow.provider]} ·{' '}
              {networkLabels[flow.wallet.network]}
            </p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {flow.wallet.address}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {flow.quote?.summary.quantity} NFT(s) · {flow.profile.displayName}
            </p>
            <div className="mt-5">
              {flow.quote && <Totals summary={flow.quote.summary} />}
            </div>
            {flow.message && (
              <p role="alert" className="mt-3 text-sm text-highlight">
                {flow.message}
              </p>
            )}
            <button
              type="button"
              disabled={flow.submit.isPending || !!flow.attempt}
              onClick={() => void flow.placeOrder()}
              className={`${primaryButton} mt-6 w-full`}
            >
              {flow.submit.isPending
                ? 'Enviando pedido…'
                : 'Confirmar pagamento'}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default function CheckoutPage() {
  const controls = useCatalogControls()
  const { user, loading, openLogin } = useAuth()
  useEffect(() => {
    const previous = document.title
    document.title = 'Pagamento | Kurio'
    return () => {
      document.title = previous
    }
  }, [])
  return (
    <>
      <div className="hidden lg:block">
        <Header {...controls} />
      </div>
      <main className="page-container min-h-dvh px-7! pt-7 pb-6 lg:min-h-0 lg:px-6! lg:pt-8 lg:pb-24">
        <div className="relative mb-5 flex min-h-11 items-center justify-center lg:hidden">
          <Link
            to="/carrinho"
            aria-label="Voltar ao carrinho"
            className="absolute left-0 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="pl-12 text-center text-xl font-bold">
            Pagamento com carteira
          </h1>
        </div>
        <nav
          aria-label="Caminho da página"
          className="mb-7 hidden gap-2 text-sm font-bold lg:flex"
        >
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/" hash="catalogo">
            Mercado
          </Link>
          <span>/</span>
          <h1>Pagamento</h1>
        </nav>
        {loading ? (
          <p
            role="status"
            className="skeleton-shimmer rounded-xl py-20 text-center"
          >
            Recuperando sua sessão…
          </p>
        ) : user ? (
          <CheckoutContent key={user.id} user={user} />
        ) : (
          <section className="mx-auto max-w-lg py-20 text-center">
            <h2 className="text-xl font-bold">
              Entre para concluir sua compra
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seus NFTs continuam no carrinho. Após entrar, você poderá escolher
              a carteira e revisar o pagamento.
            </p>
            <button
              type="button"
              onClick={openLogin}
              className={`${primaryButton} mt-6 w-full`}
            >
              Entrar para continuar
            </button>
            <Link
              to="/carrinho"
              className="mt-3 flex min-h-11 items-center justify-center text-primary"
            >
              Voltar ao carrinho
            </Link>
          </section>
        )}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </>
  )
}
