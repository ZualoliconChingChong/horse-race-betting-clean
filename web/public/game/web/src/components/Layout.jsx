import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Home, Trophy, User, LogOut, LogIn, Coins } from 'lucide-react'
import useAuthStore from '../stores/authStore'

function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-3xl">🐎</span>
            <span className="text-primary-500">Horse Race</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link 
              to="/lobby" 
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Lobby</span>
            </Link>
            
            <Link 
              to="/leaderboard" 
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
            >
              <Trophy size={18} />
              <span className="hidden sm:inline">Xếp hạng</span>
            </Link>

            {user ? (
              <>
                {/* Coins display */}
                <div className="flex items-center gap-1 px-3 py-2 bg-dark-800 rounded-lg">
                  <Coins size={18} className="text-yellow-400" />
                  <span className="font-bold text-yellow-400">
                    {user.coins?.toLocaleString()}
                  </span>
                </div>

                {/* Profile */}
                <Link 
                  to="/profile" 
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition"
              >
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-dark-400 text-sm">
          🐎 Horse Race Betting - Chơi vui, không cờ bạc thật!
        </div>
      </footer>
    </div>
  )
}

export default Layout
