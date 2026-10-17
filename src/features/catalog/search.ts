export const collectionOptions = [
  { value: 'digital-art', label: 'Arte digital' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'music', label: 'Música' },
  { value: '3d-art', label: 'Arte 3D' },
  { value: 'collectibles', label: 'Colecionáveis' },
  { value: 'generative', label: 'Generativa' },
  { value: 'games', label: 'Jogos' },
  { value: 'subscriptions', label: 'Assinaturas' },
  { value: 'utility', label: 'Utilidade' },
]
export const networkOptions = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

export type CatalogParams = {
  page: number
  q: string
  collection: string
  networks: string
  minPrice: string
  maxPrice: string
  category: 'all' | 'new' | 'trending'
  sort: 'recent' | 'price-asc' | 'price-desc'
  favorites: boolean
}

export type CatalogSearch = Partial<CatalogParams>

export function ethToUnits(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}

export function hundredthsToEth(value: number) {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}

export function ethToHundredths(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

export function normalizeCatalogSearch(
  search: Record<string, unknown>,
): CatalogParams {
  const price = (value: unknown, fallback: string) => {
    const text = String(value ?? '')
    return /^\d{1,2}(\.\d{1,2})?$/.test(text) &&
      ethToUnits(text) <= ethToUnits('15.00') &&
      ethToUnits(text) >= ethToUnits('0.02')
      ? text
      : fallback
  }
  let minPrice = price(search.minPrice, '0.02')
  let maxPrice = price(search.maxPrice, '15.00')
  if (ethToUnits(minPrice) > ethToUnits(maxPrice))
    [minPrice, maxPrice] = [maxPrice, minPrice]
  const page = Number(search.page ?? 1)
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    q: typeof search.q === 'string' ? search.q.trim().slice(0, 100) : '',
    collection: collectionOptions.some(
      (item) => item.value === search.collection,
    )
      ? String(search.collection)
      : '',
    networks: [
      ...new Set(
        String(search.networks ?? '')
          .split(',')
          .filter((value) =>
            networkOptions.some((item) => item.value === value),
          ),
      ),
    ]
      .sort()
      .join(','),
    minPrice,
    maxPrice,
    category:
      search.category === 'new' || search.category === 'trending'
        ? search.category
        : 'all',
    sort:
      search.sort === 'price-asc' || search.sort === 'price-desc'
        ? search.sort
        : 'recent',
    favorites: search.favorites === true || search.favorites === 'true',
  }
}
