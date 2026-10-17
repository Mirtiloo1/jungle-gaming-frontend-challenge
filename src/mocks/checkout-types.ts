import type {
  CollectorProfile,
  Order,
  Quote,
  Wallet,
} from '@/features/checkout/types'

export type MockCheckoutAccount = {
  profile: CollectorProfile
  wallets: Wallet[]
  quotes: Record<string, Quote>
  orders: Record<
    string,
    {
      order: Order
      resolvesAt: number
      outcome: 'confirmed' | 'declined'
      settled: boolean
    }
  >
  attempts: Record<string, { fingerprint: string; orderId: string }>
  fee: string
  avatar?: string | null
  walletNickname?: string
  secondaryUsesPrimary?: boolean
}
