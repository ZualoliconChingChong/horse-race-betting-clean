import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Gift } from 'lucide-react'
import useAuthStore from '../stores/authStore'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [dailyReward, setDailyReward] = useState(null)
  
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    
    const result = await login(username, password)
    if (result.success) {
      if (result.dailyReward > 0) {
        setDailyReward(result.dailyReward)
        setTimeout(() => {
          navigate('/lobby')
        }, 2000)
      } else {
        navigate('/lobby')
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Daily Reward Popup */}
        {dailyReward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-slideIn">
            <div className="bg-dark-900 rounded-2xl p-8 text-center max-w-sm mx-4">
              <Gift size={60} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Phần thưởng hàng ngày!</h2>
              <p className="text-dark-300 mb-4">Bạn đã nhận được</p>
              <div className="text-4xl font-bold text-yellow-400 mb-4">
                +{dailyReward} 🪙
              </div>
              <p className="text-dark-400 text-sm">Đang chuyển đến Lobby...</p>
            </div>
          </div>
        )}

        <div className="bg-dark-900 rounded-2xl p-8">
          <div className="text-center mb-6">
            <span className="text-5xl">🐎</span>
            <h1 className="text-2xl font-bold mt-2">Đăng nhập</h1>
            <p className="text-dark-400">Chào mừng trở lại!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-500 transition"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-500 transition pr-12"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <LogIn size={20} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-dark-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-500 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
