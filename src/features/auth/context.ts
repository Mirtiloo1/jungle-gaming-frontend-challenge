import { createContext, useContext } from 'react'

export type SessionUser = {
  id: string
  name: string
  email: string
  avatar?: string | null
}
type AuthContextValue = {
  user: SessionUser | null
  loading: boolean
  openLogin: () => void
  logout: () => void
  loggingOut: boolean
}
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return context
}
