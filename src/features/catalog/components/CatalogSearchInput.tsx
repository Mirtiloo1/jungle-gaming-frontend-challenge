import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type CatalogSearchInputProps = {
  onSubmit?: () => void
  onClose?: () => void
  autoFocus?: boolean
  className?: string
}

export default function CatalogSearchInput({
  onSubmit,
  onClose,
  autoFocus = false,
  className,
}: CatalogSearchInputProps) {
  const { q = '' } = useSearch({ strict: false })
  const navigate = useNavigate({ from: '/' })
  const [draft, setDraft] = useState(q)
  useEffect(() => setDraft(q), [q])
  return (
    <form
      role="search"
      aria-label="Busca de NFTs"
      className={cn(
        'flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl bg-card px-2 focus-within:ring-1 focus-within:ring-primary',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault()
        void navigate({
          to: '/',
          search: (previous) => ({ ...previous, q: draft.trim(), page: 1 }),
          hash: 'catalogo',
        })
        onSubmit?.()
      }}
    >
      <button
        type="submit"
        aria-label="Buscar NFTs"
        className="flex h-full w-10 shrink-0 items-center justify-center rounded-sm text-muted-foreground"
      >
        <Search size={20} aria-hidden="true" />
      </button>
      <input
        type="search"
        autoFocus={autoFocus}
        aria-label="Buscar coleções"
        placeholder="Explorar coleções"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-full min-w-0 flex-1 rounded-sm bg-transparent pr-2 text-sm focus-visible:outline-none"
      />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar busca"
          title="Fechar busca (Esc)"
          className="flex h-full w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-highlight"
        >
          <X size={17} aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
