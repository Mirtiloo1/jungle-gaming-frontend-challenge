import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertDialog } from 'radix-ui'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { readSessionToken, writeSessionToken } from '@/lib/session-token'
import { AuthContext } from './context'
import type { SessionUser } from './context'
import AuthDialog from './AuthDialog'
import type { AuthFieldErrors, AuthFormValues, AuthMode } from './types'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const logoutFocus = useRef<HTMLElement | null>(null)
  const [mode, setMode] = useState<AuthMode>('login')
  const returnFocus = useRef<HTMLElement | null>(null)
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async ({ signal }) => {
      const token = readSessionToken()
      const { data } = await http.get<{ user: SessionUser | null }>(
        '/session',
        { signal },
      )
      if (!data.user && token === readSessionToken()) writeSessionToken(null)
      return data
    },
    retry: false,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  const user = session.data?.user ?? null

  function clearPrivateData() {
    void client.cancelQueries({ queryKey: ['checkout'] })
    client.removeQueries({ queryKey: ['checkout'] })
    void client.cancelQueries({ queryKey: ['cart'] })
    client.removeQueries({ queryKey: ['cart'] })
    void client.cancelQueries({ queryKey: ['favorites'] })
    client.removeQueries({ queryKey: ['favorites'] })
    client.removeQueries({ queryKey: ['catalog', 'private'] })
  }

  useEffect(() => {
    const expire = () => {
      void client.cancelQueries({ queryKey: ['checkout'] })
      client.removeQueries({ queryKey: ['checkout'] })
      void client.cancelQueries({ queryKey: ['cart'] })
      client.removeQueries({ queryKey: ['cart'] })
      writeSessionToken(null)
      client.setQueryData(['session'], { user: null })
      void client.cancelQueries({ queryKey: ['favorites'] })
      client.removeQueries({ queryKey: ['favorites'] })
      client.removeQueries({ queryKey: ['catalog', 'private'] })
    }
    window.addEventListener('kurio:session-expired', expire)
    const syncOtherTab = (event: StorageEvent) => {
      if (event.key !== 'kurio.session-token' && event.key !== null) return
      void client.cancelQueries({ queryKey: ['checkout'] })
      client.removeQueries({ queryKey: ['checkout'] })
      void client.cancelQueries({ queryKey: ['session'] })
      void client.cancelQueries({ queryKey: ['cart'] })
      client.removeQueries({ queryKey: ['cart'] })
      client.setQueryData(['session'], { user: null })
      void client.cancelQueries({ queryKey: ['favorites'] })
      client.removeQueries({ queryKey: ['favorites'] })
      client.removeQueries({ queryKey: ['catalog', 'private'] })
      void client.invalidateQueries({ queryKey: ['session'] })
    }
    window.addEventListener('storage', syncOtherTab)
    return () => {
      window.removeEventListener('kurio:session-expired', expire)
      window.removeEventListener('storage', syncOtherTab)
    }
  }, [client])

  useEffect(() => {
    if (session.data?.user === null) {
      client.removeQueries({
        queryKey: ['cart'],
        predicate: (query) => query.queryKey[1] !== 'guest',
      })
      client.removeQueries({ queryKey: ['favorites'] })
      client.removeQueries({ queryKey: ['catalog', 'private'] })
    }
  }, [session.data, client])

  const login = useMutation({
    mutationFn: async (values: AuthFormValues) =>
      (
        await http.post<{ user: SessionUser; token: string }>(
          mode === 'login' ? '/session' : '/users',
          values,
        )
      ).data,
    onSuccess: (data) => {
      clearPrivateData()
      writeSessionToken(data.token)
      client.setQueryData(['session'], { user: data.user })
      setOpen(false)
    },
  })
  const logout = useMutation({
    mutationFn: () => http.delete('/session'),
    onSuccess: () => {
      setConfirmLogout(false)
      clearPrivateData()
      writeSessionToken(null)
      client.setQueryData(['session'], { user: null })
    },
  })

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: session.isPending,
        openLogin: () => {
          returnFocus.current = document.activeElement as HTMLElement
          login.reset()
          setMode('login')
          setOpen(true)
        },
        logout: () => {
          logoutFocus.current = document.activeElement as HTMLElement
          logout.reset()
          setConfirmLogout(true)
        },
        loggingOut: logout.isPending,
      }}
    >
      {children}
      <AlertDialog.Root
        open={confirmLogout}
        onOpenChange={(value) => {
          if (!logout.isPending) setConfirmLogout(value)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[110] bg-black/70" />
          <AlertDialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              if (
                logoutFocus.current?.isConnected &&
                logoutFocus.current.getClientRects().length
              )
                logoutFocus.current.focus()
              else
                Array.from(
                  document.querySelectorAll<HTMLElement>(
                    '[data-account-trigger]',
                  ),
                )
                  .find((element) => element.getClientRects().length)
                  ?.focus()
            }}
            className="fixed top-1/2 left-1/2 z-[120] w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <AlertDialog.Title className="text-lg font-bold">
              Sair da sua conta?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Seus dados, carteiras e favoritos continuarão salvos. Você poderá
              entrar novamente quando quiser.
            </AlertDialog.Description>
            {logout.isError && (
              <p role="alert" className="mt-3 text-sm text-highlight">
                {apiErrorMessage(logout.error)}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <AlertDialog.Cancel
                disabled={logout.isPending}
                className="min-h-11 flex-1 rounded-full border border-border text-sm hover:border-primary"
              >
                Continuar na conta
              </AlertDialog.Cancel>
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
                className="min-h-11 flex-1 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {logout.isPending ? 'Saindo…' : 'Sair da conta'}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {session.isError && (
        <p role="alert" className="page-container py-2 text-destructive">
          Não foi possível recuperar a sessão.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => void session.refetch()}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <AuthDialog
        open={open}
        mode={mode}
        onModeChange={(nextMode) => {
          login.reset()
          setMode(nextMode)
        }}
        onOpenChange={setOpen}
        onSubmit={(values) => login.mutate(values)}
        pending={login.isPending}
        error={login.isError ? apiErrorMessage(login.error) : undefined}
        fieldErrors={
          isAxiosError<{ fields?: AuthFieldErrors }>(login.error)
            ? login.error.response?.data.fields
            : undefined
        }
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (returnFocus.current?.isConnected) returnFocus.current.focus()
          else
            Array.from(
              document.querySelectorAll<HTMLElement>('[data-account-trigger]'),
            )
              .find((element) => element.getClientRects().length > 0)
              ?.focus()
        }}
      />
    </AuthContext.Provider>
  )
}
