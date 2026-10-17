import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context'
import { http } from '@/lib/http'
import { readGuestId, readSessionToken } from '@/lib/session-token'
import { apiErrorMessage } from '@/lib/api-error'
import { CartContext } from './context'
import type { CartInput, CartResponse } from './types'

export default function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user, loading } = useAuth()
  const client = useQueryClient()
  const key = ['cart', user?.id ?? 'guest', readGuestId()]
  const token = readSessionToken()
  const cart = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      (await http.get<CartResponse>('/cart', { signal })).data,
    enabled: !loading,
    staleTime: 10_000,
    retry: false,
  })
  const add = useMutation({
    mutationFn: async (item: CartInput) =>
      (await http.post<CartResponse>('/cart/items', item)).data,
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: (data) => {
      if (readSessionToken() === token) client.setQueryData(key, data)
      else client.removeQueries({ queryKey: key })
    },
    retry: false,
  })
  const edit = useMutation({
    mutationFn: async (action: { item: CartInput } | { code: string }) => {
      if (readSessionToken() !== token)
        throw new Error('Sessão alterada. Tente novamente.')
      if ('item' in action) {
        const { nftId, editionId, quantity } = action.item
        return (
          await http.patch<CartResponse>(
            `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`,
            { quantity },
          )
        ).data
      }
      return (
        await http.put<CartResponse>('/cart/promotion', { code: action.code })
      ).data
    },
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSuccess: (data) => {
      if (readSessionToken() === token) client.setQueryData(key, data)
      else client.removeQueries({ queryKey: key })
    },
    retry: false,
  })
  return (
    <CartContext.Provider
      value={{
        quantity: cart.data?.quantity ?? 0,
        adding: add.isPending,
        error: add.error,
        data: cart.data,
        loading: loading || cart.isPending,
        loadError: cart.error,
        refetch: () => {
          void cart.refetch()
        },
        updating: edit.isPending || add.isPending,
        updateItem: (item) => edit.mutateAsync({ item }),
        applyPromotion: (code) => edit.mutateAsync({ code }),
        addItem: (item) => add.mutateAsync(item),
        openCart: () => setOpen(true),
      }}
    >
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] bg-black/60"
          />
          <Dialog.Content className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-md flex-col border-l border-border bg-card p-6">
            <Dialog.Title className="pr-10 text-xl font-bold">
              Carrinho de NFTs
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Confira os itens selecionados. Adicionar ao carrinho não confirma
              uma compra.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar carrinho"
                className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-md"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </Dialog.Close>
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
              {cart.isPending && <p role="status">Carregando carrinho…</p>}
              {cart.isError && (
                <div role="alert">
                  <p>{apiErrorMessage(cart.error)}</p>
                  <button
                    type="button"
                    onClick={() => void cart.refetch()}
                    className="mt-3 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {cart.data?.items.length === 0 && <p>Seu carrinho está vazio.</p>}
              <ul className="space-y-4">
                {cart.data?.items.map((item) => (
                  <li
                    key={`${item.nftId}-${item.editionId}`}
                    className="flex gap-3 border-b border-border pb-4"
                  >
                    <img
                      src={item.image}
                      alt=""
                      width={72}
                      height={72}
                      className="size-18 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold">{item.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Edição {item.edition} · Qtd. {item.quantity}
                      </p>
                      <p className="mt-2 font-bold text-highlight">
                        {item.total} ETH
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {cart.data?.warnings.map((warning) => (
                <p
                  key={warning}
                  role="status"
                  className="mt-3 text-sm text-highlight"
                >
                  {warning}
                </p>
              ))}
            </div>
            {cart.data && (
              <p className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
                <span>Subtotal</span>
                <span className="text-highlight">{cart.data.subtotal} ETH</span>
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              O pagamento está indisponível nesta demonstração.
            </p>
            <Dialog.Close asChild>
              <a
                href="/carrinho"
                className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
              >
                Ver carrinho
              </a>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-4 min-h-11 rounded-md bg-primary px-5 font-bold text-primary-foreground"
              >
                Continuar explorando
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </CartContext.Provider>
  )
}
