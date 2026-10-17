import { ChevronDown, CircleUserRound, LogIn, LogOut } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useAuth } from './context'
import { Link } from '@tanstack/react-router'

export default function SessionButton({
  compact = false,
}: {
  compact?: boolean
}) {
  const { user, loading, openLogin, logout, loggingOut } = useAuth()
  if (user)
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            data-account-trigger
            aria-label={`Abrir menu da conta de ${user.name}`}
            title={`Conta de ${user.name}`}
            className={
              compact
                ? 'relative flex min-h-11 min-w-11 items-center justify-center rounded-lg text-highlight'
                : 'flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card p-1 pr-3 text-primary transition hover:border-primary'
            }
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-[#995d30] text-sm font-bold text-primary-foreground"
              >
                {user.name
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toLocaleUpperCase('pt-BR')}
              </span>
            )}
            {!compact && <ChevronDown size={14} aria-hidden="true" />}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="z-[80] min-w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 text-sm shadow-xl"
          >
            <DropdownMenu.Label className="px-3 py-2">
              <span className="block font-bold">{user.name}</span>
              <span className="mt-1 block break-all text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <Link
                to="/perfil"
                className="flex min-h-11 items-center rounded-md px-3 outline-none data-highlighted:bg-secondary data-highlighted:text-highlight"
              >
                Meu perfil
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                to="/perfil/carteiras"
                className="flex min-h-11 items-center rounded-md px-3 outline-none data-highlighted:bg-secondary data-highlighted:text-highlight"
              >
                Carteiras
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled={loggingOut}
              onSelect={logout}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 outline-none data-highlighted:bg-secondary data-highlighted:text-highlight data-disabled:opacity-50"
            >
              <LogOut size={16} aria-hidden="true" />
              {loggingOut ? 'Saindo…' : 'Sair da conta'}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  const Icon = compact ? CircleUserRound : LogIn
  return (
    <button
      type="button"
      disabled={loading || loggingOut}
      onClick={openLogin}
      aria-label="Entrar na conta"
      title="Entrar na conta"
      className={
        compact
          ? 'relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60'
          : 'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors duration-200 hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      <Icon size={20} aria-hidden="true" />
      {!compact && 'Entrar'}
    </button>
  )
}
