import { Minus, Plus } from 'lucide-react'

type QuantitySelectorProps = {
  quantity: number
  maximum: number
  disabled?: boolean
  onChange: (quantity: number) => void
}
export default function QuantitySelector({
  quantity,
  maximum,
  disabled,
  onChange,
}: QuantitySelectorProps) {
  return (
    <div
      role="group"
      aria-label="Quantidade de NFTs"
      className="inline-flex shrink-0 items-center gap-1"
    >
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="flex h-11 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={20} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantidade"
        min={1}
        max={Math.max(1, maximum)}
        step={1}
        disabled={disabled}
        value={quantity}
        onChange={(event) => {
          const next = event.target.valueAsNumber
          if (Number.isFinite(next))
            onChange(
              Math.min(Math.max(1, Math.trunc(next)), Math.max(1, maximum)),
            )
        }}
        className="h-11 w-9 rounded-sm bg-transparent text-center text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || quantity >= maximum}
        onClick={() => onChange(quantity + 1)}
        className="flex h-11 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
