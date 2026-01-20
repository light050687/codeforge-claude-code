import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi } from '../api/client'

interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  score: number
  solutions_count: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.getMe()
      setUser(response.data)
    } catch {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async () => {
    try {
      const response = await authApi.getGithubUrl()
      // Redirect to GitHub OAuth
      window.location.href = response.data.url
    } catch (error) {
      console.error('Failed to get GitHub auth URL:', error)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    // Optionally call backend logout
    authApi.logout().catch(() => {
      // Ignore errors, token already removed client-side
    })
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Handle OAuth callback - extract token from URL and store it
 */
export function handleAuthCallback(): string | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname)
    return token
  }

  return null
}
