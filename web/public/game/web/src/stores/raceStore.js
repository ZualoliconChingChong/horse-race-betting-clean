import { create } from 'zustand'
import api from '../services/api'

const useRaceStore = create((set, get) => ({
  races: [],
  currentRace: null,
  participants: [],
  gameState: null,
  isLoading: false,
  error: null,

  // Fetch active races
  fetchActiveRaces: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/race/active')
      set({ races: response.data.races, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Fetch single race
  fetchRace: async (raceId) => {
    set({ isLoading: true })
    try {
      const response = await api.get(`/race/${raceId}`)
      set({ 
        currentRace: response.data.race,
        participants: response.data.participants,
        isLoading: false 
      })
      return response.data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return null
    }
  },

  // Join race
  joinRace: async (raceId, data) => {
    try {
      const response = await api.post(`/race/${raceId}/join`, data)
      return { success: true, ...response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to join race' 
      }
    }
  },

  // Create race (admin)
  createRace: async (mapData, registrationMinutes = 30) => {
    try {
      const response = await api.post('/race/create', { mapData, registrationMinutes })
      // Refresh races list
      get().fetchActiveRaces()
      return { success: true, race: response.data.race }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create race' 
      }
    }
  },

  // Start race (admin)
  startRace: async (raceId) => {
    try {
      const response = await api.post(`/race/${raceId}/start`)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to start race' 
      }
    }
  },

  // Update game state from socket
  setGameState: (state) => {
    set({ gameState: state })
  },

  // Update race from socket event
  updateRace: (raceId, updates) => {
    set(state => ({
      races: state.races.map(r => 
        r.id === raceId ? { ...r, ...updates } : r
      ),
      currentRace: state.currentRace?.id === raceId 
        ? { ...state.currentRace, ...updates }
        : state.currentRace
    }))
  },

  // Add participant from socket
  addParticipant: (raceId, participant) => {
    set(state => {
      if (state.currentRace?.id === raceId) {
        return {
          participants: [...state.participants, participant]
        }
      }
      return state
    })
  },

  // Race finished
  setRaceFinished: (raceId, results) => {
    set(state => ({
      currentRace: state.currentRace?.id === raceId 
        ? { ...state.currentRace, status: 'finished', results }
        : state.currentRace
    }))
  },

  // Clear current race
  clearCurrentRace: () => {
    set({ currentRace: null, participants: [], gameState: null })
  }
}))

export default useRaceStore
