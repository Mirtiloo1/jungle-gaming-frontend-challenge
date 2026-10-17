import type { Nft } from '@/features/catalog/types'

export type NftEdition = {
  id: string
  label: string
  price: string
  available: number
  maxPerOrder: number
}
export type NftDetail = Nft & {
  tokenId: string
  collectionName: string
  networkLabel: string
  description: string
  mobileDescription: string
  attributes: string[]
  rating: number
  reviewCount: number
  gallery: {
    id: string
    label: string
    src: string
    scale: number
    origin: string
  }[]
  editions: NftEdition[]
  defaultEditionId: string
  paragraphs: string[]
  contract: string
  creator: string
  royalty: string
  reviews: {
    id: string
    author: string
    rating: number
    date: string
    comment: string
  }[]
}
