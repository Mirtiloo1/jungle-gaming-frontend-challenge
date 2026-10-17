import HeroSection from '@/features/catalog/components/HeroSection'
import Header from '../components/layout/Header'
import CatalogSection from '@/features/catalog/components/CatalogSection'
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { CatalogFilterState } from '@/features/catalog/types'
import PromotionalBanners from '@/features/home/components/PromotionalBanners'
import EditorialSection from '@/features/home/components/EditorialSection'
import Footer from '@/components/layout/Footer'
import {
  normalizeCatalogSearch,
  ethToHundredths,
  hundredthsToEth,
} from '@/features/catalog/search'
import { useCatalogFacets } from '@/features/catalog/hooks'
import NftRealtimeProvider from '@/features/nft/NftRealtimeProvider'

export function HomePage() {
  const search = useSearch({ from: '/' })
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

  function applyFilters() {
    void navigate({
      search: (previous) => ({
        ...previous,
        page: 1,
        collection: filters.collection,
        networks: [...filters.networks].sort().join(','),
        minPrice: hundredthsToEth(filters.priceRange[0]),
        maxPrice: hundredthsToEth(filters.priceRange[1]),
      }),
      hash: 'catalogo',
    })
  }
  const controls = {
    filters,
    onFiltersChange: setFilters,
    onApplyFilters: applyFilters,
    collectionCounts: facets.data?.collectionCounts,
    networkCounts: facets.data?.networkCounts,
  }

  return (
    <NftRealtimeProvider>
      <Header {...controls} />
      <main className="page-container">
        <HeroSection />
        <CatalogSection {...controls} />
        <PromotionalBanners />
        <EditorialSection />
      </main>
      <Footer />
    </NftRealtimeProvider>
  )
}
