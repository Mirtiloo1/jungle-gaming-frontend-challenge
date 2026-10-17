import type { CartResponse } from '@/features/cart/types'

export type Network = 'ethereum' | 'polygon' | 'solana'
export type Provider = 'walletconnect' | 'metamask' | 'coinbase'
export type CollectorProfile = {
  displayName: string
  username: string
  profileName: string
  email: string
  referral: string
  ens: string
  notes: string
}
export type Wallet = {
  id: string
  name: string
  address: string
  ens: string
  network: Network
  connected: boolean
  provider: Provider | null
  kind?: Provider
  isPrimary?: boolean
  details?: {
    displayName: string
    profileName: string
    email: string
    referral: string
    secondaryAddress: string
  }
}
export type CheckoutSetup = { profile: CollectorProfile; wallets: Wallet[] }
export type Quote = {
  id: string
  walletId: string
  provider: Provider
  network: Network
  walletAddress: string
  expiresAt: number
  summary: CartResponse
}
export type OrderInput = { quoteId: string; profile: CollectorProfile }
export type Order = {
  id: string
  version: number
  status: 'pending' | 'confirmed' | 'declined'
  createdAt: string
  transactionId: string | null
  reason: string | null
  wallet: Wallet
  profile: CollectorProfile
  summary: CartResponse
}
export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}
export const providerLabels: Record<Provider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}
