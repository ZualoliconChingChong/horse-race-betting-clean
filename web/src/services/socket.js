import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) return

    const serverUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:3001'

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected')
      
      // Authenticate if we have a token
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        try {
          const { state } = JSON.parse(stored)
          if (state?.token) {
            this.socket.emit('auth', state.token)
          }
        } catch (e) {}
      }
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    this.socket.on('auth:success', (data) => {
      console.log('✅ Socket authenticated:', data.username)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Join a race room
  joinRace(raceId) {
    if (this.socket) {
      this.socket.emit('race:join', raceId)
    }
  }

  // Leave a race room
  leaveRace(raceId) {
    if (this.socket) {
      this.socket.emit('race:leave', raceId)
    }
  }

  // Send chat message
  sendChat(raceId, message) {
    if (this.socket) {
      this.socket.emit('chat:message', { raceId, message })
    }
  }

  // Listen for events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // Remove listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()
export default socketService
