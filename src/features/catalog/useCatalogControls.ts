import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCatalogFacets } from './hooks'
import {
  ethToHundredths,
  hundredthsToEth,
  normalizeCatalogSearch,
} from './search'
import type { CatalogControlsProps, CatalogFilterState } from './types'

export function useCatalogControls(): CatalogControlsProps {
  const search = useSearch({ strict: false })
  const navigate = useNavigate({ from: '/' })
  const { collection, networks, minPrice, maxPrice } =
    normalizeCatalogSearch(search)
  const facets = useCatalogFacets()
  const [filters, setFilters] = useState<CatalogFilterState>({
    collection,
    networks: networks ? networks.split(',') : [],
    priceRange: [ethToHundredths(minPrice), ethToHundredths(maxPrice)],
  })
  useEffect(() => {
    setFilters({
      collection,
      networks: networks ? networks.split(',') : [],
      priceRange: [ethToHundredths(minPrice), ethToHundredths(maxPrice)],
    })
  }, [collection, networks, minPrice, maxPrice])
  return {
    filters,
    onFiltersChange: setFilters,
    onApplyFilters: () =>
      void navigate({
        to: '/',
        search: (previous) => ({
          ...previous,
          page: 1,
          collection: filters.collection,
          networks: [...filters.networks].sort().join(','),
          minPrice: hundredthsToEth(filters.priceRange[0]),
          maxPrice: hundredthsToEth(filters.priceRange[1]),
        }),
        hash: 'catalogo',
      }),
    collectionCounts: facets.data?.collectionCounts,
    networkCounts: facets.data?.networkCounts,
  }
}
