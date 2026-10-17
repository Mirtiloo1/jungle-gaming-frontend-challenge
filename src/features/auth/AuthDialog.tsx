import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { Eye, EyeOff, Facebook, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuthFieldErrors, AuthFormValues, AuthMode } from './types'

type AuthDialogProps = {
  open: boolean
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AuthFormValues) => void
  onCloseAutoFocus: (event: Event) => void
  pending: boolean
  error?: string
  fieldErrors?: AuthFieldErrors
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4H3v2.7A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 14a6 6 0 0 1 0-4V7.3H3a10 10 0 0 0 0 9.4L6.4 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.3L6.4 10c.8-2.3 3-4 5.6-4Z"
      />
    </svg>
  )
}

export default function AuthDialog({
  open,
  mode,
  onModeChange,
  onOpenChange,
  onSubmit,
  onCloseAutoFocus,
  pending,
  error,
  fieldErrors = {},
}: AuthDialogProps) {
  const register = mode === 'register'
  const contentRef = useRef<HTMLDivElement>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [localErrors, setLocalErrors] = useState<AuthFieldErrors>({})
  const [notice, setNotice] = useState('')
  const errors = { ...fieldErrors, ...localErrors }

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmation(false)
    setLocalErrors({})
    setNotice('')
    if (!open) {
      setUsername('')
      setEmail('')
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const resetScroll = () => contentRef.current?.scrollTo({ top: 0 })
    desktop.addEventListener('change', resetScroll)
    return () => desktop.removeEventListener('change', resetScroll)
  }, [open, mode])

  const inputClass =
    'min-h-12 w-full rounded-md border border-input bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-primary lg:min-h-11'

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-110 bg-black/70" />
        <Dialog.Content
          ref={contentRef}
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed inset-0 z-120 overflow-y-auto overscroll-contain bg-background text-foreground lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[94dvh] lg:w-[calc(100%-3rem)] lg:max-w-120 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-sm lg:border-b-8 lg:border-primary lg:bg-card"
        >
          <Dialog.Title className="sr-only">
            {register ? 'Criar conta na Kurio' : 'Entrar na Kurio'}
          </Dialog.Title>
          <div className="mx-auto w-full max-w-md px-6 pt-30 pb-6 lg:px-14 lg:pt-10 lg:pb-16">
            <p
              aria-hidden="true"
              className="text-center text-3xl font-bold tracking-[0.12em] lg:hidden"
            >
              KURIO
            </p>
            <div
              role="group"
              aria-label="Escolher acesso"
              className="hidden items-center justify-center gap-2 text-xl font-bold lg:flex"
            >
              <button
                type="button"
                aria-label="Ir para login"
                aria-pressed={!register}
                disabled={pending}
                onClick={() => onModeChange('login')}
                className={cn('rounded-sm', !register && 'text-highlight')}
              >
                Entrar
              </button>
              <span
                aria-hidden="true"
                className="h-6 border-l border-primary"
              />
              <button
                type="button"
                aria-label="Ir para cadastro"
                aria-pressed={register}
                disabled={pending}
                onClick={() => onModeChange('register')}
                className={cn('rounded-sm', register && 'text-highlight')}
              >
                Criar conta
              </button>
            </div>
            <h2 className="mt-18 text-center text-lg font-bold lg:hidden">
              {register ? 'Criar perfil de colecionador' : 'Entrar'}
            </h2>
            <Dialog.Description className="sr-only lg:not-sr-only lg:mt-8 lg:text-center lg:text-sm lg:leading-5">
              {register
                ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
                : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
            </Dialog.Description>

            <form
              className="mt-8 lg:mt-6"
              onSubmit={(event) => {
                event.preventDefault()
                if (pending) return
                const validation: AuthFieldErrors = {}
                if (
                  register &&
                  !/^[\p{L}\p{N}_.-]{3,24}$/u.test(username.trim())
                )
                  validation.username =
                    'Use de 3 a 24 letras, números, pontos, traços ou sublinhados.'
                if (
                  register &&
                  (password.length < 8 ||
                    !/[a-z]/i.test(password) ||
                    !/\d/.test(password))
                )
                  validation.password =
                    'Use pelo menos 8 caracteres, incluindo letras e números.'
                if (register && password !== confirmPassword)
                  validation.confirmPassword = 'As senhas precisam ser iguais.'
                setLocalErrors(validation)
                if (Object.keys(validation).length) return
                setNotice('')
                onSubmit({
                  username: username.trim(),
                  email: email.trim(),
                  password,
                  confirmPassword,
                })
              }}
            >
              <div className="space-y-3">
                {register && (
                  <div>
                    <label htmlFor="auth-username" className="sr-only">
                      Nome de usuário
                    </label>
                    <input
                      id="auth-username"
                      autoComplete="username"
                      placeholder="Nome de usuário"
                      required
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      aria-invalid={Boolean(errors.username)}
                      aria-describedby={
                        errors.username ? 'auth-username-error' : undefined
                      }
                      className={cn(inputClass, 'text-center lg:text-left')}
                    />
                    {errors.username && (
                      <p
                        id="auth-username-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.username}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="sr-only">
                    E-mail
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete={register ? 'email' : 'username'}
                    placeholder={
                      register ? 'Digite seu e-mail' : 'contato@email.com'
                    }
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email
                        ? 'auth-email-error'
                        : error
                          ? 'auth-error'
                          : undefined
                    }
                    className={inputClass}
                  />
                  {errors.email && (
                    <p
                      id="auth-email-error"
                      role="alert"
                      className="mt-1 text-xs text-destructive"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="auth-password" className="sr-only">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        register ? 'new-password' : 'current-password'
                      }
                      placeholder={register ? 'Senha' : '************'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password
                          ? 'auth-password-error'
                          : error
                            ? 'auth-error'
                            : undefined
                      }
                      className={cn(inputClass, 'pr-12')}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Ocultar senha' : 'Mostrar senha'
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-muted-foreground"
                    >
                      {showPassword ? (
                        <Eye size={18} aria-hidden="true" />
                      ) : (
                        <EyeOff size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      id="auth-password-error"
                      role="alert"
                      className="mt-1 text-xs text-destructive"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>
                {register && (
                  <div>
                    <label htmlFor="auth-confirm-password" className="sr-only">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <input
                        id="auth-confirm-password"
                        type={showConfirmation ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Confirmar senha"
                        required
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={
                          errors.confirmPassword
                            ? 'auth-confirm-error'
                            : undefined
                        }
                        className={cn(inputClass, 'pr-12')}
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirmation
                            ? 'Ocultar confirmação de senha'
                            : 'Mostrar confirmação de senha'
                        }
                        aria-pressed={showConfirmation}
                        onClick={() =>
                          setShowConfirmation((previous) => !previous)
                        }
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-muted-foreground"
                      >
                        {showConfirmation ? (
                          <Eye size={18} aria-hidden="true" />
                        ) : (
                          <EyeOff size={18} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p
                        id="auth-confirm-error"
                        role="alert"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!register && (
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      'A recuperação de senha não está disponível nesta demonstração.',
                    )
                  }
                  className="mt-2 ml-auto flex min-h-8 items-center text-xs text-highlight hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
              {error && (
                <p
                  id="auth-error"
                  role="alert"
                  className="mt-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="mt-6 min-h-14 w-full cursor-pointer rounded-md bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60 lg:min-h-12"
              >
                {pending ? (
                  register ? (
                    'Criando conta…'
                  ) : (
                    'Entrando…'
                  )
                ) : register ? (
                  <>
                    <span className="lg:hidden">Criar perfil</span>
                    <span className="hidden lg:inline">Criar conta</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs lg:my-7">
              <span className="h-px flex-1 bg-border" />
              <span>Ou continue com</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    'A entrada com Google não está disponível nesta demonstração. Use seu e-mail e senha.',
                  )
                }
                className="flex min-h-10 w-full items-center justify-center gap-3 rounded-md border border-border text-sm text-muted-foreground hover:border-primary lg:min-h-11"
              >
                <GoogleIcon />
                Continuar com Google
              </button>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    'A entrada com Facebook não está disponível nesta demonstração. Use seu e-mail e senha.',
                  )
                }
                className="flex min-h-10 w-full items-center justify-center gap-3 rounded-md border border-border text-sm text-muted-foreground hover:border-primary lg:min-h-11"
              >
                <Facebook
                  size={20}
                  fill="currentColor"
                  className="text-[#4267b2]"
                  aria-hidden="true"
                />
                Continuar com Facebook
              </button>
            </div>
            {notice && (
              <p
                role="status"
                className="mt-4 text-xs leading-5 text-muted-foreground"
              >
                {notice}
              </p>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => onModeChange(register ? 'login' : 'register')}
              className="mt-6 min-h-11 w-full text-center text-sm text-muted-foreground hover:text-highlight lg:hidden"
            >
              {register
                ? 'Já tem uma conta? Entre'
                : 'Novo na Kurio? Crie uma conta'}
            </button>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              disabled={pending}
              aria-label="Fechar login"
              className="fixed top-1 right-1 flex size-11 items-center justify-center rounded-sm text-primary lg:absolute"
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
