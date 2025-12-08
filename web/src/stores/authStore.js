import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Login
      login: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { username, password })
          const { token, user, dailyReward, message } = response.data
          
          set({ 
            token, 
            user, 
            isLoading: false,
            error: null 
          })
          
          // Set token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true, dailyReward, message }
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // Register
      register: async (username, password, facebookUrl = '', facebookName = '') => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', { 
            username, 
            password,
            facebookUrl: facebookUrl || null,
            facebookName: facebookName || null
          })
          const { token, user, message } = response.data
          
          set({ 
            token, 
            user, 
            isLoading: false,
            error: null 
          })
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true, message }
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      // Logout
      logout: () => {
        set({ user: null, token: null, error: null })
        delete api.defaults.headers.common['Authorization']
      },

      // Refresh user data
      refreshUser: async () => {
        const { token } = get()
        if (!token) return
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          set({ user: response.data.user })
        } catch (error) {
          // Token invalid, logout
          get().logout()
        }
      },

      // Update coins locally (after bet/win)
      updateCoins: (newAmount) => {
        set(state => ({
          user: state.user ? { ...state.user, coins: newAmount } : null
        }))
      },

      updateAvatar: (avatar) => {
        set(state => ({
          user: state.user ? { ...state.user, avatar } : null
        }))
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)

export default useAuthStore
