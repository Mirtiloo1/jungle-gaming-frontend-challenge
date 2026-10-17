import { useId } from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'
import type { CatalogFilterState } from '../types'
import { collectionOptions, networkOptions } from '../search'

const collections = [
  { value: '', label: 'Todas as coleções' },
  ...collectionOptions,
]
const networks = networkOptions

type FilterValues = {
  collection: string
  networks: string[]
  minPrice: string
  maxPrice: string
}

type CatalogFiltersProps = {
  value: CatalogFilterState
  onChange: (value: CatalogFilterState) => void
  onApply?: (filters: FilterValues) => void
  collectionCounts?: Partial<Record<string, number>>
  networkCounts?: Partial<Record<string, number>>
}

// Inteiros no slider; strings decimais no contrato com a API.
function toEth(hundredths: number) {
  return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`
}

export default function CatalogFilters({
  value,
  onChange,
  onApply,
  collectionCounts = {},
  networkCounts = {},
}: CatalogFiltersProps) {
  const collectionGroupId = useId()
  const { collection, networks: selectedNetworks, priceRange } = value

  function toggleNetwork(network: string) {
    onChange({
      ...value,
      networks: selectedNetworks.includes(network)
        ? selectedNetworks.filter((item) => item !== network)
        : [...selectedNetworks, network],
    })
  }

  return (
    <div className="space-y-8 bg-card p-5">
      <fieldset>
        <legend className="mb-3 text-lg font-bold">Coleções</legend>

        <div className="space-y-1">
          {collections.map((item) => (
            <label
              key={item.value}
              className={cn(
                'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                collection === item.value
                  ? 'text-highlight'
                  : 'text-muted-foreground',
              )}
            >
              <input
                type="radio"
                name={`collection-${collectionGroupId}`}
                value={item.value}
                checked={collection === item.value}
                onChange={() => onChange({ ...value, collection: item.value })}
                className="sr-only"
              />

              <span>{item.label}</span>
              <span className="ml-auto flex shrink-0 items-center gap-3">
                {collectionCounts[item.value] !== undefined && (
                  <span>({collectionCounts[item.value]})</span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-1 rounded-full bg-primary transition-opacity',
                    collection === item.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-bold">Faixa de preço</legend>

        <div className="px-3">
          <SliderPrimitive.Root
            value={priceRange}
            onValueChange={([min, max]) =>
              onChange({ ...value, priceRange: [min, max] })
            }
            min={2}
            max={1500}
            step={1}
            className="relative flex h-8 w-full touch-none items-center select-none"
          >
            <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-primary">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
            </SliderPrimitive.Track>
            {['Preço mínimo em ETH', 'Preço máximo em ETH'].map(
              (label, index) => (
                <SliderPrimitive.Thumb
                  key={label}
                  aria-label={label}
                  aria-valuetext={`${toEth(priceRange[index]).replace('.', ',')} ETH`}
                  className="block size-5 rounded-full border-[3px] border-background bg-primary"
                />
              ),
            )}
          </SliderPrimitive.Root>

          <p className="mt-2 text-sm tabular-nums">
            Preço: {toEth(priceRange[0]).replace('.', ',')} –{' '}
            {toEth(priceRange[1]).replace('.', ',')} ETH
          </p>

          <button
            type="button"
            onClick={() =>
              onApply?.({
                collection,
                networks: selectedNetworks,
                minPrice: toEth(priceRange[0]),
                maxPrice: toEth(priceRange[1]),
              })
            }
            className="mt-2 min-h-9 rounded-md bg-primary px-3 py-1.5 font-bold text-primary-foreground hover:bg-primary/90"
          >
            Aplicar
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-bold">Rede</legend>

        <div className="space-y-1">
          {networks.map((network) => (
            <label
              key={network.value}
              className={cn(
                'flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                selectedNetworks.includes(network.value)
                  ? 'text-highlight'
                  : 'text-muted-foreground',
              )}
            >
              <input
                type="checkbox"
                checked={selectedNetworks.includes(network.value)}
                onChange={() => toggleNetwork(network.value)}
                className="sr-only"
              />

              <span>{network.label}</span>
              <span className="ml-auto flex shrink-0 items-center gap-3">
                {networkCounts[network.value] !== undefined && (
                  <span>({networkCounts[network.value]})</span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-1 rounded-full bg-primary transition-opacity',
                    selectedNetworks.includes(network.value)
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
