import { useEffect, useState } from 'react'
import { Dialog } from 'radix-ui'
import { SlidersHorizontal, X } from 'lucide-react'
import CatalogFilters from './CatalogFilters'
import type { CatalogFilterState } from '../types'

type MobileCatalogFiltersProps = {
  value: CatalogFilterState
  onChange: (value: CatalogFilterState) => void
  onApply: () => void
  collectionCounts?: Record<string, number>
  networkCounts?: Record<string, number>
}

export default function MobileCatalogFilters({
  value,
  onChange,
  onApply,
  collectionCounts,
  networkCounts,
}: MobileCatalogFiltersProps) {
  const [open, setOpen] = useState(false)

  // Ao mudar para desktop, libera o modal e a rolagem da página.
  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir filtros"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/60 to-primary text-primary-foreground"
        >
          <SlidersHorizontal size={20} aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[90] bg-black/60"
        />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[90dvh] flex-col rounded-t-3xl bg-card text-foreground shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <Dialog.Title className="text-lg font-bold">Filtros</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar filtros"
                className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Escolha a coleção, a faixa de preço e as redes do catálogo.
          </Dialog.Description>
          <div className="min-h-0 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            <CatalogFilters
              value={value}
              onChange={onChange}
              collectionCounts={collectionCounts}
              networkCounts={networkCounts}
              onApply={() => {
                onApply()
                setOpen(false)
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
