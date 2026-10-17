import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import type { Order } from '@/features/checkout/types'
import Receipt from '@/features/checkout/Receipt'

const statusLabels = {
  pending: 'Em processamento',
  confirmed: 'Compra confirmada',
  declined: 'Pagamento recusado',
}

export default function AccountActivity({ userId }: { userId: string }) {
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const receiptTrigger = useRef<HTMLButtonElement | null>(null)
  const history = useQuery({
    queryKey: ['checkout', userId, 'activity'],
    queryFn: async ({ signal }) =>
      (await http.get<{ orders: Order[] }>('/orders', { signal })).data,
    refetchInterval: (query) =>
      query.state.data?.orders.some((order) => order.status === 'pending')
        ? 1500
        : 30_000,
    retry: false,
  })
  const receipt = history.data?.orders.find(
    (order) => order.id === receiptId && order.status === 'confirmed',
  )
  return (
    <section aria-label="Histórico de compras">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Sua atividade</h1>
        <button
          className="min-h-11 text-xs text-primary disabled:opacity-50"
          disabled={history.isFetching}
          onClick={() => void history.refetch()}
        >
          Atualizar
        </button>
      </div>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Acompanhe suas compras e consulte os detalhes de cada pedido.
      </p>
      {history.isPending ? (
        <p role="status">Carregando atividade…</p>
      ) : history.isError ? (
        <div role="alert">
          <p>{apiErrorMessage(history.error)}</p>
          <button
            className="mt-3 min-h-11 text-primary underline"
            onClick={() => void history.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      ) : history.data.orders.length ? (
        <div className="space-y-4">
          {history.data.orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">
                  Pedido #{order.id.slice(0, 8)}
                </h2>
                <span className="rounded-full border border-primary/40 px-3 py-1 text-xs text-highlight">
                  {statusLabels[order.status]}
                </span>
              </div>
              <time
                dateTime={order.createdAt}
                className="mt-2 block text-xs text-muted-foreground"
              >
                {new Date(order.createdAt).toLocaleString('pt-BR')}
              </time>
              <ul className="my-4 space-y-3">
                {order.summary.items.map((item) => (
                  <li
                    key={`${item.nftId}-${item.editionId}`}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="size-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0 text-sm">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: item.nftId }}
                        className="font-bold hover:text-highlight"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Edição {item.edition} · Qtd. {item.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {order.reason && (
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {order.reason}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-sm font-bold text-highlight">
                  {order.summary.total} ETH
                </p>
                {order.status === 'confirmed' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      receiptTrigger.current = event.currentTarget
                      setReceiptId(order.id)
                    }}
                    className="inline-flex min-h-11 items-center rounded-full border border-primary px-4 text-xs text-primary"
                  >
                    Ver recibo
                  </button>
                ) : (
                  <Link
                    to="/pagamento"
                    search={{ pedido: order.id }}
                    className="inline-flex min-h-11 items-center rounded-full border border-primary px-4 text-xs text-primary"
                  >
                    Ver pedido
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
          <ShoppingBag
            className="mx-auto mb-4 text-primary"
            size={30}
            aria-hidden="true"
          />
          <h2 className="font-bold">Você ainda não fez nenhuma compra</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Seus pedidos aparecerão aqui assim que você confirmar uma compra.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-bold text-primary-foreground"
          >
            Explorar NFTs
          </Link>
        </div>
      )}
      {receipt && (
        <Receipt
          order={receipt}
          open={true}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            receiptTrigger.current?.focus()
          }}
          onOpenChange={(open) => {
            if (!open) setReceiptId(null)
          }}
        />
      )}
    </section>
  )
}
