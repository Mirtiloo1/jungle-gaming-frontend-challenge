import { cn } from '@/lib/utils'
import type { CatalogParams } from '../search'

const categories = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
] as const

type CatalogToolbarProps = {
  category: CatalogParams['category']
  sort: CatalogParams['sort']
  onCategoryChange: (category: CatalogParams['category']) => void
  onSortChange: (sort: CatalogParams['sort']) => void
}

export default function CatalogToolbar({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div
        role="group"
        aria-label="Destaques do catálogo"
        className="flex flex-wrap gap-x-5 gap-y-2"
      >
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => onCategoryChange(item.value)}
            className={cn(
              'min-h-11 border-b-2 text-sm',
              category === item.value
                ? 'border-primary font-bold text-highlight'
                : 'border-transparent text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span>Ordenar por:</span>

        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as CatalogParams['sort'])
          }
          className="min-h-11 min-w-0 rounded-md bg-background p-2"
        >
          <option value="recent">Listados recentemente</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </label>
    </div>
  )
}
