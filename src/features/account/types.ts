import type { CollectorProfile, Wallet } from '@/features/checkout/types'
import type { SessionUser } from '@/features/auth/context'

export type AccountProfile = CollectorProfile & {
  avatar: string | null
  walletNickname: string
}
export type ProfileInput = AccountProfile & {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
export type ProfileResponse = { profile: AccountProfile; user: SessionUser }
export type WalletList = { wallets: Wallet[]; secondaryUsesPrimary: boolean }
export type WalletInput = Pick<
  Wallet,
  'name' | 'address' | 'ens' | 'network' | 'kind' | 'isPrimary' | 'details'
>
