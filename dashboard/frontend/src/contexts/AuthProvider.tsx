import React, { ReactNode, useEffect, useState } from 'react'

import {
  clearStoredAuthToken,
  getStoredAuthToken,
  installAuthenticatedFetch,
  notifyUnauthorized,
  storeAuthToken,
  UNAUTHORIZED_EVENT,
} from '../utils/authFetch'
import { AuthContext, type AuthUser } from './AuthContextShared'

const readErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.text()
  if (!body) {
    return `HTTP ${response.status}: ${response.statusText}`
  }

  try {
    const payload = JSON.parse(body) as { message?: string; error?: string }
    return payload.message ?? payload.error ?? body
  } catch {
    return body
  }
}

installAuthenticatedFetch()

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredAuthToken()))

  const clearSession = () => {
    setToken(null)
    setUser(null)
    clearStoredAuthToken()
  }

  const setSession = (nextToken: string, nextUser?: AuthUser | null) => {
    storeAuthToken(nextToken)
    setToken(nextToken)
    setUser(nextUser ?? null)
  }

  useEffect(() => {
    if (token) {
      storeAuthToken(token)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    void refreshSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
      setIsLoading(false)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const refreshSession = async () => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        if (response.status === 401) {
          clearSession()
        }
        return
      }
      const payload = (await response.json()) as { user?: AuthUser }
      setUser(payload?.user ?? null)
    } catch {
      notifyUnauthorized()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const payload = (await response.json()) as { token: string; user?: AuthUser }
      setSession(payload.token, payload.user ?? null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearSession()
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated: Boolean(token),
        login,
        setSession,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
