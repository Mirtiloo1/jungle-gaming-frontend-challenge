import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  Heart,
  LogOut,
  CreditCard,
  Plus,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useCatalogControls } from '@/features/catalog/useCatalogControls'
import { useAuth } from '@/features/auth/context'
import type { SessionUser } from '@/features/auth/context'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { DemoNoticeButton } from '@/components/ui/demo-notice-button'
import Avatar from '@/features/account/Avatar'
import ProfileForm from '@/features/account/ProfileForm'
import WalletForm from '@/features/account/WalletForm'
import type { ProfileResponse, WalletList } from '@/features/account/types'
import { networkLabels } from '@/features/checkout/types'
import WalletDialog from '@/features/checkout/WalletDialog'
import AccountFavorites from '@/features/account/AccountFavorites'
import AccountActivity from '@/features/account/AccountActivity'

function AccountContent({
  user,
  walletsPage,
  view,
}: {
  user: SessionUser
  walletsPage: boolean
  view: string
}) {
  const { logout, loggingOut } = useAuth()
  const client = useQueryClient()
  const profile = useQuery({
    queryKey: ['checkout', user.id, 'profile'],
    queryFn: async ({ signal }) =>
      (await http.get<ProfileResponse>('/profile', { signal })).data,
    staleTime: 30_000,
    retry: false,
  })
  const wallets = useQuery({
    queryKey: ['checkout', user.id, 'wallets'],
    queryFn: async ({ signal }) =>
      (await http.get<WalletList>('/wallets', { signal })).data,
    enabled: walletsPage,
    staleTime: 30_000,
    retry: false,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [preferenceDraft, setPreferenceDraft] = useState<boolean | null>(null)
  const preference = useMutation({
    mutationFn: async (value: boolean) =>
      (
        await http.put<WalletList>('/wallets/preferences', {
          secondaryUsesPrimary: value,
        })
      ).data,
    onSuccess: (data) => {
      client.setQueryData(['checkout', user.id, 'wallets'], data)
      setPreferenceDraft(null)
    },
    onError: () => setPreferenceDraft(null),
    retry: false,
  })
  const primary =
    wallets.data?.wallets.find((wallet) => wallet.isPrimary) ??
    wallets.data?.wallets.find((wallet) => wallet.id === 'primary') ??
    wallets.data?.wallets[0]
  const selected =
    selectedId === 'new'
      ? undefined
      : (wallets.data?.wallets.find((wallet) => wallet.id === selectedId) ??
        primary)
  const secondary =
    wallets.data?.wallets.filter((wallet) => wallet.id !== primary?.id) ?? []
  const navItem =
    'flex min-h-11 w-full items-center gap-4 border-l-4 px-3 text-left text-sm text-primary transition hover:bg-secondary/40'
  return (
    <>
      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 lg:hidden">
        <Avatar src={user.avatar} name={user.name} className="size-16" />
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">
            Seu espaço na Kurio
          </p>
          <p className="mt-1 truncate text-lg font-bold">{user.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="hidden bg-card lg:block">
          <h2 className="px-3 py-4 text-lg font-bold">Meu perfil</h2>
          <nav aria-label="Menu do perfil">
            <Link
              to="/perfil"
              aria-current={view === '/perfil' ? 'page' : undefined}
              activeOptions={{ exact: true }}
              className={cn(
                navItem,
                view === '/perfil' ? 'border-primary' : 'border-transparent',
              )}
            >
              <UserRound size={18} />
              Dados do perfil
            </Link>
            <Link
              to="/perfil/carteiras"
              aria-current={walletsPage ? 'page' : undefined}
              className={cn(
                navItem,
                walletsPage ? 'border-primary' : 'border-transparent',
              )}
            >
              <CreditCard size={18} />
              Carteiras
            </Link>
            <Link
              to="/perfil/atividade"
              aria-current={view === '/perfil/atividade' ? 'page' : undefined}
              className={cn(
                navItem,
                view === '/perfil/atividade'
                  ? 'border-primary'
                  : 'border-transparent',
              )}
            >
              <ShoppingCart size={18} />
              Atividade
            </Link>
            <Link
              to="/perfil/favoritos"
              aria-current={view === '/perfil/favoritos' ? 'page' : undefined}
              className={cn(
                navItem,
                view === '/perfil/favoritos'
                  ? 'border-primary'
                  : 'border-transparent',
              )}
            >
              <Heart size={18} />
              Lista de interesse
            </Link>
            {[
              { title: 'Ofertas', icon: TrendingUp },
              { title: 'Arquivos baixados', icon: Download },
              { title: 'Suporte', icon: TriangleAlert },
            ].map(({ title, icon: Icon }) => (
              <DemoNoticeButton
                key={title}
                title={title}
                description="Esta funcionalidade ainda não está disponível. Em breve você poderá acessá-la por aqui."
                className={`${navItem} border-transparent`}
              >
                <Icon size={18} />
                {title}
              </DemoNoticeButton>
            ))}
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className={`${navItem} border-t border-l-transparent border-t-border font-bold disabled:opacity-50`}
            >
              <LogOut size={18} />
              {loggingOut ? 'Saindo…' : 'Sair'}
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <nav
            aria-label="Menu do perfil mobile"
            className="mb-5 grid grid-cols-2 gap-1 rounded-3xl border border-border bg-card p-1 lg:hidden"
          >
            <Link
              to="/perfil"
              activeOptions={{ exact: true }}
              aria-current={view === '/perfil' ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-full text-sm',
                view === '/perfil'
                  ? 'bg-primary font-bold text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <UserRound size={16} />
              Perfil
            </Link>
            <Link
              to="/perfil/carteiras"
              aria-current={walletsPage ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-full text-sm',
                walletsPage
                  ? 'bg-primary font-bold text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <CreditCard size={16} />
              Carteiras
            </Link>
            {[
              {
                to: '/perfil/atividade',
                label: 'Atividade',
                icon: ShoppingCart,
              },
              { to: '/perfil/favoritos', label: 'Favoritos', icon: Heart },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={view === to ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-full text-sm',
                  view === to
                    ? 'bg-primary font-bold text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          {view === '/perfil/atividade' ? (
            <AccountActivity userId={user.id} />
          ) : view === '/perfil/favoritos' ? (
            <AccountFavorites />
          ) : profile.isPending || (walletsPage && wallets.isPending) ? (
            <div aria-label="Carregando conta" className="space-y-5">
              <div className="skeleton-shimmer h-40 rounded-xl" />
              <div className="skeleton-shimmer h-64 rounded-xl" />
            </div>
          ) : profile.isError || (walletsPage && wallets.isError) ? (
            <div role="alert" className="rounded-xl border border-border p-6">
              <p>{apiErrorMessage(profile.error ?? wallets.error)}</p>
              <button
                type="button"
                onClick={() => {
                  void profile.refetch()
                  if (walletsPage) void wallets.refetch()
                }}
                className="mt-4 min-h-11 text-primary underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            profile.data &&
            (walletsPage ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h1 className="text-xl font-bold lg:text-lg">
                    Suas carteiras
                  </h1>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="flex min-h-11 items-center gap-1 text-sm font-bold text-primary"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
                <div
                  className="mb-6 flex gap-3 overflow-x-auto pb-2"
                  role="group"
                  aria-label="Selecionar carteira para editar"
                >
                  {wallets.data?.wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      aria-pressed={selected?.id === wallet.id}
                      onClick={() => setSelectedId(wallet.id)}
                      className={cn(
                        'min-h-16 min-w-36 rounded-xl border px-4 py-3 text-left text-xs transition',
                        selected?.id === wallet.id
                          ? 'border-primary bg-card'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      <span className="block font-bold">{wallet.name}</span>
                      <span className="mt-1 block">
                        {wallet.id === primary?.id ? 'Principal' : 'Secundária'}{' '}
                        · {networkLabels[wallet.network]}
                      </span>
                    </button>
                  ))}
                </div>
                <WalletForm
                  key={selected?.id ?? 'new'}
                  wallet={selected}
                  profile={profile.data.profile}
                  userId={user.id}
                  primary={selected?.id === primary?.id || !primary}
                  onSaved={(id) => setSelectedId(id)}
                />
                <section className="mt-7 rounded-2xl border border-border p-4 lg:border-0 lg:p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-bold">Carteira secundária</h2>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          preferenceDraft ??
                          wallets.data?.secondaryUsesPrimary ??
                          false
                        }
                        disabled={preference.isPending}
                        onChange={(event) => {
                          setPreferenceDraft(event.target.checked)
                          preference.mutate(event.target.checked)
                        }}
                        className="size-4 shrink-0 appearance-none rounded-full border border-primary bg-transparent checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--color-background)] disabled:opacity-50"
                      />
                      Igual à carteira principal
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {wallets.data?.secondaryUsesPrimary
                      ? 'A carteira principal também será usada como secundária.'
                      : secondary.length
                        ? `${secondary.length} carteira(s) secundária(s) cadastrada(s). Selecione acima para editar.`
                        : 'Você ainda não adicionou uma carteira secundária.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="mt-2 min-h-11 text-sm text-primary"
                  >
                    Adicionar carteira secundária
                  </button>
                  {preference.isError && (
                    <p role="alert" className="text-xs text-highlight">
                      {apiErrorMessage(preference.error)}
                    </p>
                  )}
                </section>
              </>
            ) : (
              <ProfileForm initial={profile.data.profile} userId={user.id} />
            ))
          )}
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-7 flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary lg:hidden"
          >
            <LogOut size={17} />
            Sair da conta
          </button>
          <WalletDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            mode="add"
            wallets={wallets.data?.wallets ?? []}
            onSelect={setSelectedId}
            onAdded={(wallet) => {
              client.setQueryData<WalletList>(
                ['checkout', user.id, 'wallets'],
                (previous) => ({
                  wallets: [...(previous?.wallets ?? []), wallet],
                  secondaryUsesPrimary: previous?.secondaryUsesPrimary ?? false,
                }),
              )
              void client.invalidateQueries({ queryKey: ['checkout', user.id] })
              setSelectedId(wallet.id)
            }}
          />
        </div>
      </div>
    </>
  )
}

export default function AccountPage() {
  const controls = useCatalogControls()
  const { user, loading, openLogin } = useAuth()
  const view = useRouterState({
    select: (state) => state.location.pathname,
  })
  const walletsPage = view === '/perfil/carteiras'
  useEffect(() => {
    const previous = document.title
    document.title = `${walletsPage ? 'Carteiras' : view === '/perfil/atividade' ? 'Atividade' : view === '/perfil/favoritos' ? 'Favoritos' : 'Meu perfil'} | Kurio`
    return () => {
      document.title = previous
    }
  }, [walletsPage, view])
  return (
    <>
      <div className="hidden lg:block">
        <Header {...controls} />
      </div>
      <main className="page-container min-h-dvh pt-5 pb-36 lg:pt-8 lg:pb-16">
        <div className="mb-5 flex min-h-11 items-center gap-4 lg:hidden">
          <Link
            to="/"
            aria-label="Voltar ao início"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <p className="text-xl font-bold">Minha conta</p>
        </div>
        {loading ? (
          <div
            className="skeleton-shimmer h-80 rounded-2xl"
            aria-label="Recuperando sessão"
          />
        ) : user ? (
          <AccountContent
            key={user.id}
            user={user}
            walletsPage={walletsPage}
            view={view}
          />
        ) : (
          <section className="mx-auto max-w-md py-16 text-center">
            <h1 className="text-xl font-bold">Entre para acessar sua conta</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Seus dados e carteiras ficam disponíveis após o login.
            </p>
            <button
              type="button"
              onClick={openLogin}
              className="mt-6 min-h-12 w-full rounded-full bg-primary px-5 font-bold text-primary-foreground"
            >
              Entrar na conta
            </button>
            <Link
              to="/"
              className="mt-3 flex min-h-11 items-center justify-center text-primary"
            >
              Voltar ao início
            </Link>
          </section>
        )}
      </main>
    </>
  )
}
