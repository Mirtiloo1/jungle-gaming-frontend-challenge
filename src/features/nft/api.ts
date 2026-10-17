import { http } from '@/lib/http'
import type { Nft } from '@/features/catalog/types'
import type { NftDetail } from './types'

export async function fetchNftDetail(id: string, signal: AbortSignal) {
  return (
    await http.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })
  ).data
}
export async function fetchRelatedNfts(id: string, signal: AbortSignal) {
  return (
    await http.get<{ items: Nft[] }>(
      `/nfts/${encodeURIComponent(id)}/related`,
      { signal },
    )
  ).data
}
