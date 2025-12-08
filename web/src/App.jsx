import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './stores/authStore'
import socketService from './services/socket'

// Pages
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Lobby from './pages/Lobby'
import Race from './pages/Race'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import MyHorse from './pages/MyHorse'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore()
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  const { token, refreshUser } = useAuthStore()

  useEffect(() => {
    // Connect socket
    socketService.connect()

    // Refresh user data if we have a token
    if (token) {
      refreshUser()
    }

    return () => {
      socketService.disconnect()
    }
  }, [token, refreshUser])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        
        {/* Protected routes */}
        <Route path="lobby" element={
          <ProtectedRoute><Lobby /></ProtectedRoute>
        } />
        <Route path="race/:id" element={
          <ProtectedRoute><Race /></ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="my-horse" element={
          <ProtectedRoute><MyHorse /></ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
