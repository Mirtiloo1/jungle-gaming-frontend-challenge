import { readDatabase, writeDatabase } from './database'

export type NftMarketEvent = {
  id: string
  version: number
  price: string
  available: number
}

export function updateNftMarket(): NftMarketEvent | null {
  const data = readDatabase()
  if (data.nftMarket['nft-001']) return null
  const event: NftMarketEvent = {
    id: 'nft-001',
    version: 1,
    price: '1.29',
    available: 1,
  }
  data.nftMarket[event.id] = {
    version: event.version,
    price: event.price,
    available: event.available,
  }
  for (const [owner, lines] of Object.entries(data.carts)) {
    const line = lines.find(
      (item) => item.nftId === event.id && item.editionId === 'limited-50',
    )
    if (!line || line.quantity <= event.available) continue
    line.quantity = event.available
    data.cartWarnings[owner] = [
      ...(data.cartWarnings[owner] ?? []),
      'A quantidade de Emerald Ape #042 foi ajustada ao limite disponível.',
    ]
  }
  writeDatabase(data)
  return event
}
