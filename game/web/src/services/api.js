import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token from localStorage on startup
const stored = localStorage.getItem('auth-storage')
if (stored) {
  try {
    const { state } = JSON.parse(stored)
    if (state?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
    }
  } catch (e) {
    // Invalid stored data
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
