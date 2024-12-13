import { create } from 'zustand'
import { config } from '@/lib/config'

interface AuthState {
  token: string | null
  user: any | null
  setToken: (token: string | null) => void
  setUser: (user: any | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null })
})) 