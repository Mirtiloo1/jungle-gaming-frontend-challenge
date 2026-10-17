import { ShoppingCart } from 'lucide-react'
import { useCart } from './context'
import { useNavigate } from '@tanstack/react-router'

export default function CartButton({ compact = false }: { compact?: boolean }) {
  const { quantity } = useCart()
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label={`Abrir carrinho (${quantity} itens)`}
      onClick={() => void navigate({ to: '/carrinho' })}
      className={
        compact
          ? 'relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary'
          : 'relative flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-card hover:text-primary'
      }
    >
      <span
        className="relative inline-flex shrink-0"
        data-testid="cart-icon-anchor"
      >
        <ShoppingCart
          size={compact ? 20 : 24}
          fill={compact ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {quantity > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground"
          >
            {quantity}
          </span>
        )}
      </span>
    </button>
  )
}
