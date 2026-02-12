import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Trophy, User, LogOut, LogIn, Coins, Shield, Menu, X } from 'lucide-react'
import useAuthStore from '../stores/authStore'

function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold shrink-0" onClick={closeMobileMenu}>
            <span className="text-2xl sm:text-3xl">🐎</span>
            <span className="text-primary-500">Horse Race</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link 
              to="/lobby" 
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
            >
              <Home size={18} />
              <span>Lobby</span>
            </Link>
            
            <Link 
              to="/leaderboard" 
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
            >
              <Trophy size={18} />
              <span>Xếp hạng</span>
            </Link>

            {user && (
              <Link 
                to="/my-horse" 
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition"
              >
                <span className="text-lg">🐴</span>
                <span>Ngựa của tôi</span>
              </Link>
            )}

            {user && (user.is_admin === 1 || user.username === 'admin') && (
              <Link 
                to="/admin" 
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-dark-800 transition bg-purple-500/20 text-purple-400"
              >
                <Shield size={18} />
                <span>Admin</span>
              </Link>
            )}

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
                  <span>{user.username}</span>
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

          {/* Mobile: Coins + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div className="flex items-center gap-1 px-2 py-1.5 bg-dark-800 rounded-lg text-sm">
                <Coins size={14} className="text-yellow-400" />
                <span className="font-bold text-yellow-400">
                  {user.coins?.toLocaleString()}
                </span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-dark-800 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-900 border-t border-dark-700 animate-slideIn">
            <nav className="max-w-7xl mx-auto px-3 py-3 flex flex-col gap-1">
              <Link 
                to="/lobby" 
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/lobby' ? 'bg-dark-700 text-primary-400' : 'hover:bg-dark-800'}`}
              >
                <Home size={20} />
                <span className="font-medium">Lobby</span>
              </Link>
              
              <Link 
                to="/leaderboard" 
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/leaderboard' ? 'bg-dark-700 text-primary-400' : 'hover:bg-dark-800'}`}
              >
                <Trophy size={20} />
                <span className="font-medium">Xếp hạng</span>
              </Link>

              {user && (
                <>
                  <Link 
                    to="/my-horse" 
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/my-horse' ? 'bg-dark-700 text-primary-400' : 'hover:bg-dark-800'}`}
                  >
                    <span className="text-xl">🐴</span>
                    <span className="font-medium">Ngựa của tôi</span>
                  </Link>

                  <Link 
                    to="/profile" 
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/profile' ? 'bg-dark-700 text-primary-400' : 'hover:bg-dark-800'}`}
                  >
                    <User size={20} />
                    <span className="font-medium">{user.username}</span>
                  </Link>

                  {(user.is_admin === 1 || user.username === 'admin') && (
                    <Link 
                      to="/admin" 
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition bg-purple-500/10 ${location.pathname === '/admin' ? 'bg-purple-500/20 text-purple-400' : 'text-purple-400 hover:bg-purple-500/20'}`}
                    >
                      <Shield size={20} />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}

                  <div className="border-t border-dark-700 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 transition w-full"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <Link 
                  to="/login" 
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition"
                >
                  <LogIn size={20} />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-700 py-3 sm:py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 text-center text-dark-400 text-xs sm:text-sm">
          🐎 Horse Race Betting - Chơi vui, không cờ bạc thật!
        </div>
      </footer>
    </div>
  )
}

export default Layout
