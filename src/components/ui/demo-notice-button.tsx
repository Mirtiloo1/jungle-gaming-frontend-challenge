import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'

type DemoNoticeButtonProps = {
  children: ReactNode
  title: string
  description: string
  className?: string
  'aria-label'?: string
}

// Ações auxiliares abrem um aviso em vez de simular uma operação bem-sucedida.
export function DemoNoticeButton({
  children,
  title,
  description,
  className,
  'aria-label': ariaLabel,
}: DemoNoticeButtonProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className={className} aria-label={ariaLabel}>
          {children}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[100] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <Dialog.Title className="pr-10 text-lg font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar aviso"
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-lg text-muted-foreground"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
