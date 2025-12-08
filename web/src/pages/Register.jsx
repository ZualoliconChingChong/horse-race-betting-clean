import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Gift, Facebook, Info } from 'lucide-react'
import useAuthStore from '../stores/authStore'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [facebookName, setFacebookName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showFbTip, setShowFbTip] = useState(false)
  
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')
    
    // Validate
    if (password !== confirmPassword) {
      setLocalError('Mật khẩu không khớp')
      return
    }

    if (username.length < 3) {
      setLocalError('Tên đăng nhập phải có ít nhất 3 ký tự')
      return
    }

    if (password.length < 4) {
      setLocalError('Mật khẩu phải có ít nhất 4 ký tự')
      return
    }

    // Validate Facebook URL if provided
    if (facebookUrl && !facebookUrl.includes('facebook.com')) {
      setLocalError('URL Facebook không hợp lệ')
      return
    }
    
    const result = await register(username, password, facebookUrl, facebookName)
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => {
        navigate('/lobby')
      }, 2500)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Success Popup */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-slideIn">
            <div className="bg-dark-900 rounded-2xl p-8 text-center max-w-sm mx-4">
              <Gift size={60} className="text-green-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">Đăng ký thành công!</h2>
              <p className="text-dark-300 mb-4">Bạn đã nhận được</p>
              <div className="text-4xl font-bold text-yellow-400 mb-4">
                500 🪙
              </div>
              <p className="text-dark-400 text-sm">Đang chuyển đến Lobby...</p>
            </div>
          </div>
        )}

        <div className="bg-dark-900 rounded-2xl p-8">
          <div className="text-center mb-6">
            <span className="text-5xl">🐎</span>
            <h1 className="text-2xl font-bold mt-2">Đăng ký</h1>
            <p className="text-dark-400">Nhận ngay 500 coin miễn phí!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error || localError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-500 transition"
                placeholder="3-20 ký tự"
                minLength={3}
                maxLength={20}
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
                  placeholder="Ít nhất 4 ký tự"
                  minLength={4}
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

            <div>
              <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-500 transition"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            {/* Facebook Info Section */}
            <div className="border-t border-dark-700 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Facebook size={20} className="text-blue-500" />
                <span className="font-medium">Thông tin Facebook</span>
                <button
                  type="button"
                  onClick={() => setShowFbTip(!showFbTip)}
                  className="ml-auto text-dark-400 hover:text-blue-400"
                  title="Xem hướng dẫn"
                >
                  <Info size={18} />
                </button>
              </div>
              
              {showFbTip && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3 text-sm">
                  <p className="font-bold text-blue-400 mb-2">📱 Cách lấy URL Facebook:</p>
                  <div className="space-y-2 text-dark-300">
                    <p><strong>🖥️ PC:</strong> Vào trang cá nhân → Copy URL từ thanh địa chỉ</p>
                    <p><strong>📱 Mobile:</strong> Vào trang cá nhân → Chọn <strong>...</strong> → Sao chép liên kết trang cá nhân</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên Facebook</label>
                  <input
                    type="text"
                    value={facebookName}
                    onChange={(e) => setFacebookName(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-blue-500 transition"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL Facebook</label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-blue-500 transition"
                    placeholder="https://facebook.com/..."
                  />
                </div>
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
                  <UserPlus size={20} />
                  Đăng ký
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-dark-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-500 hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
