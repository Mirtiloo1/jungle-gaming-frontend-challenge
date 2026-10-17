import { useQuery } from '@tanstack/react-query'
import { fetchCatalog, fetchCatalogFacets } from './api'
import type { CatalogParams } from './search'
import { useAuth } from '@/features/auth/context'

export function useCatalog(params: CatalogParams) {
  const { user, loading } = useAuth()
  return useQuery({
    queryKey: [
      'catalog',
      params.favorites ? 'private' : 'public',
      params.favorites ? user?.id : null,
      params,
    ],
    queryFn: ({ signal }) => fetchCatalog(params, signal),
    enabled: !params.favorites || (!loading && Boolean(user)),
    staleTime: 30_000,
    retry: false,
  })
}

export function useCatalogFacets() {
  return useQuery({
    queryKey: ['catalog-facets'],
    queryFn: ({ signal }) => fetchCatalogFacets(signal),
    staleTime: 60_000,
    retry: false,
  })
}
