import { createContext, useContext } from 'react'
import type { CartInput, CartResponse } from './types'

export const CartContext = createContext<{
  quantity: number
  adding: boolean
  error: unknown
  data: CartResponse | undefined
  loading: boolean
  loadError: unknown
  refetch: () => void
  updating: boolean
  updateItem: (item: CartInput) => Promise<CartResponse>
  applyPromotion: (code: string) => Promise<CartResponse>
  addItem: (item: CartInput) => Promise<CartResponse>
  openCart: () => void
} | null>(null)
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa estar dentro de CartProvider.')
  return context
}
