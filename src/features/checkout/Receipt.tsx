import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { MailCheck, X } from 'lucide-react'
import type { Order } from './types'
import { networkLabels, providerLabels } from './types'

export default function Receipt({
  order,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  order: Order
  open: boolean
  onOpenChange: (value: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const [explorer, setExplorer] = useState(false)
  if (order.status !== 'confirmed') return null
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-background/85" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 z-[100] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-b-8 border-primary bg-card text-sm shadow-2xl"
        >
          <div className="px-6 pt-8 pb-4 text-center">
            <MailCheck
              size={52}
              strokeWidth={1}
              aria-hidden="true"
              className="mx-auto mb-3 text-primary"
            />
            <Dialog.Title className="text-lg font-bold">
              Pedido confirmado
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-xs text-muted-foreground">
              Seus NFTs agora estão na sua carteira de demonstração.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar confirmação"
              className="absolute top-1 right-1 flex size-11 items-center justify-center text-primary"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </Dialog.Close>
          <dl className="grid grid-cols-2 gap-3 border-y border-primary/60 bg-secondary/40 px-6 py-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">ID da transação</dt>
              <dd title={order.transactionId!}>
                {order.transactionId!.slice(0, 8)}…
                {order.transactionId!.slice(-4)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd>
                {new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(order.createdAt))}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd>{order.summary.total} ETH</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Carteira</dt>
              <dd>{providerLabels[order.wallet.provider!]}</dd>
            </div>
          </dl>
          <div className="px-6 py-5">
            <h3 className="mb-3 font-bold">Detalhes da transação</h3>
            <ul className="space-y-3">
              {order.summary.items.map((item) => (
                <li
                  key={`${item.nftId}-${item.editionId}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={item.image}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold">{item.name}</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ID do token: {item.tokenId}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Edição {item.edition} · × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-highlight">
                    {item.total} ETH
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt>Subtotal</dt>
                <dd>{order.summary.subtotal} ETH</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Desconto</dt>
                <dd>− {order.summary.discount} ETH</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Taxa de rede</dt>
                <dd>{order.summary.networkFee} ETH</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border pb-3 font-bold">
                <dt>Total</dt>
                <dd className="text-highlight">{order.summary.total} ETH</dd>
              </div>
            </dl>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Transação simulada confirmada na rede{' '}
              {networkLabels[order.wallet.network]}. Nenhum ativo ou valor real
              foi transferido.
            </p>
            <button
              type="button"
              onClick={() => setExplorer((value) => !value)}
              aria-expanded={explorer}
              className="mx-auto mt-5 flex min-h-11 items-center rounded-sm bg-primary px-5 text-xs font-bold text-primary-foreground hover:brightness-110"
            >
              Ver transação simulada
            </button>
            {explorer && (
              <div className="mt-4 rounded-md border border-border p-3 text-xs">
                <p className="font-bold">Explorador de demonstração</p>
                <p className="mt-2 break-all text-muted-foreground">
                  {order.transactionId}
                </p>
                <p className="mt-2">
                  Pedido: <span className="break-all">{order.id}</span>
                </p>
                <p className="mt-2 break-all">
                  Destino: {order.wallet.address}
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
