import { http } from '@/lib/http'
import type { CatalogParams } from './search'
import type { CatalogResponse } from './types'

export async function fetchCatalog(params: CatalogParams, signal: AbortSignal) {
  return (await http.get<CatalogResponse>('/nfts', { params, signal })).data
}

export async function fetchCatalogFacets(signal: AbortSignal) {
  return (
    await http.get<Pick<CatalogResponse, 'collectionCounts' | 'networkCounts'>>(
      '/nfts/facets',
      { signal },
    )
  ).data
}
