export type CartInput = { nftId: string; editionId: string; quantity: number }
export type CartLine = CartInput & {
  name: string
  image: string
  edition: string
  price: string
  total: string
  tokenId: string
  maximum: number
}
export type CartResponse = {
  items: CartLine[]
  quantity: number
  subtotal: string
  warnings: string[]
  promotion: string
  discount: string
  networkFee: string
  total: string
}
