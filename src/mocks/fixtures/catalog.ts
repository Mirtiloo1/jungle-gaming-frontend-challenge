import type { Nft } from '@/features/catalog/types'
import { collectionOptions, hundredthsToEth } from '@/features/catalog/search'

const templates = [
  ['Emerald Ape #042', 'ape-glasses.png', 119],
  ['Sage Nomad #009', 'ape-hoodie.png', 169],
  ['Neon Vessel #552', 'ape_suit.png', 199],
  ['Cosmic Bloom #118', 'ape-hoodie.png', 129],
  ['Violet Nomad #314', 'ape-hoodie.png', 139],
  ['Ivory Baron #088', 'ape_suit.png', 179],
  ['Golden Beat #207', 'ape-headset.png', 99],
  ['Golden Echo #208', 'ape-headset.png', 149],
  ['Golden Signal #160', 'ape-headset.png', 39],
] as const

export const catalogFixtures: Nft[] = Array.from({ length: 36 }, (_, index) => {
  const [baseName, image, basePrice] = templates[index % templates.length]
  const extra = Math.floor(index / templates.length)
  const name = extra ? `${baseName.split(' #')[0]} #${600 + index}` : baseName
  return {
    id: `nft-${String(index + 1).padStart(3, '0')}`,
    name,
    image: `/assets/images/${image}`,
    imageAlt: `Arte digital da coleção ${name}`,
    price: hundredthsToEth(basePrice + extra * 230),
    ...(index === 2 ? { previousPrice: '2.29' } : {}),
    collection:
      index < 18
        ? 'digital-art'
        : collectionOptions[1 + ((index - 18) % 8)].value,
    network: ['ethereum', 'polygon', 'solana'][index % 3],
    isNew: index < 12,
    trending: index % 3 === 0,
    createdAt: new Date(Date.UTC(2026, 8, 30, 12, 0, -index)).toISOString(),
  }
})
