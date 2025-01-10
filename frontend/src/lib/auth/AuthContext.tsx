'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  accessToken: string | null
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently()
          setAccessToken(token)
        } catch (error) {
          console.error('Error getting access token:', error)
        }
      }
    }

    getToken()
  }, [isAuthenticated, getAccessTokenSilently])

  const login = async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: returnTo || '/dashboard' },
        authorizationParams: {
          prompt: 'login',
          screen_hint: 'signup'
        }
      })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const logout = () => {
    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      }
    })
    setAccessToken(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user, 
        accessToken,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 