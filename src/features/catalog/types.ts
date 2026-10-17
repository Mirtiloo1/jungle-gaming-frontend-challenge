export type CatalogFilterState = {
  collection: string
  networks: string[]
  priceRange: [number, number]
}

export type CatalogControlsProps = {
  filters: CatalogFilterState
  onFiltersChange: (filters: CatalogFilterState) => void
  onApplyFilters: () => void
  collectionCounts?: Record<string, number>
  networkCounts?: Record<string, number>
}

export type Nft = {
  id: string
  name: string
  image: string
  imageAlt: string
  price: string
  previousPrice?: string
  collection: string
  network: string
  isNew: boolean
  trending: boolean
  createdAt: string
}

export type CatalogResponse = {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  collectionCounts: Record<string, number>
  networkCounts: Record<string, number>
}
