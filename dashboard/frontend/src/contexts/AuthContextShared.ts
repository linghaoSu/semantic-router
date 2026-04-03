import { createContext } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
  role?: string
  permissions?: string[]
}

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  setSession: (token: string, user?: AuthUser | null) => void
  logout: () => void
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
