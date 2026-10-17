import { getNftDetail } from './fixtures/nft-detail'
import { ethToUnits } from '@/features/catalog/search'
import { unitsToEth } from '@/lib/eth'
import type { MockDatabase } from './database'
import type { CartLine, CartResponse } from '@/features/cart/types'

export function cartResponse(data: MockDatabase, owner: string): CartResponse {
  const items: CartLine[] = (data.carts[owner] ?? []).flatMap((line) => {
    const nft = getNftDetail(line.nftId)
    const edition = nft?.editions.find((item) => item.id === line.editionId)
    if (!nft || !edition) return []
    return [
      {
        ...line,
        name: nft.name,
        image: nft.image,
        edition: edition.label,
        tokenId: nft.tokenId,
        maximum: Math.min(edition.available, edition.maxPerOrder),
        price: edition.price,
        total: unitsToEth(ethToUnits(edition.price) * BigInt(line.quantity)),
      },
    ]
  })
  const subtotal = items.reduce((sum, item) => sum + ethToUnits(item.total), 0n)
  const promotion = data.cartPromotions[owner] ?? ''
  const discount = promotion === 'KURIO10' ? subtotal / 10n : 0n
  const fee = items.length
    ? ethToUnits(data.checkout[owner.replace('user:', '')]?.fee ?? '0.016')
    : 0n
  return {
    items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: unitsToEth(subtotal),
    promotion,
    discount: unitsToEth(discount),
    networkFee: unitsToEth(fee),
    total: unitsToEth(subtotal - discount + fee),
    warnings: data.cartWarnings[owner] ?? [],
  }
}

export function mergeGuestCart(
  data: MockDatabase,
  userId: string,
  guestId: string | null,
) {
  if (!guestId) return
  const guest = `guest:${guestId}`,
    owner = `user:${userId}`
  const items = data.carts[owner] ?? []
  const warnings: string[] = []
  for (const line of data.carts[guest] ?? []) {
    const nft = getNftDetail(line.nftId)
    const edition = nft?.editions.find((item) => item.id === line.editionId)
    if (!nft || !edition) continue
    const existing = items.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    const requested = (existing?.quantity ?? 0) + line.quantity
    const quantity = Math.min(requested, edition.available, edition.maxPerOrder)
    if (quantity < requested)
      warnings.push(
        `A quantidade de ${nft.name} foi ajustada ao limite disponível.`,
      )
    if (existing) existing.quantity = quantity
    else if (quantity > 0) items.push({ ...line, quantity })
  }
  data.carts[owner] = items
  data.cartWarnings[owner] = warnings
  if (!data.cartPromotions[owner] && data.cartPromotions[guest])
    data.cartPromotions[owner] = data.cartPromotions[guest]
  delete data.cartPromotions[guest]
  delete data.carts[guest]
}
