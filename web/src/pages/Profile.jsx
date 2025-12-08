import { useEffect, useState } from 'react'
import { User, Coins, Trophy, History, TrendingUp } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import api from '../services/api'

function Profile() {
  const { user, updateAvatar } = useAuthStore()
  const [transactions, setTransactions] = useState([])
  const [bets, setBets] = useState([])
  const [activeTab, setActiveTab] = useState('transactions')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [txRes, betsRes] = await Promise.all([
          api.get('/user/transactions'),
          api.get('/user/bets')
        ])
        setTransactions(txRes.data.transactions || [])
        setBets(betsRes.data.bets || [])
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const winRate = user?.total_races > 0 
    ? Math.round((user.total_wins / user.total_races) * 100) 
    : 0

  const avatarOptions = ['🐎', '🔥', '⭐', '👑', '🎲', '🏆']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-dark-900 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-3xl">
            {user?.avatar || '🐎'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User size={24} />
              {user?.username}
            </h1>
            <p className="text-dark-400">
              Tham gia từ {new Date(user?.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
              <Coins size={28} />
              {user?.coins?.toLocaleString()}
            </div>
            <p className="text-dark-400 text-sm">Số dư hiện tại</p>
          </div>
        </div>
      </div>

      {/* Avatar section */}
      <div className="bg-dark-900 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold mb-2">Ảnh đại diện</h2>
        <p className="text-dark-400 text-sm mb-2">Chọn một biểu tượng để làm avatar của bạn.</p>
        <div className="flex flex-wrap gap-3">
          {avatarOptions.map((a) => {
            const selected = user?.avatar === a
            return (
              <button
                key={a}
                onClick={async () => {
                  try {
                    await api.post('/user/avatar', { avatar: a })
                    updateAvatar(a)
                  } catch (error) {
                    console.error('Failed to update avatar', error)
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition 
                  ${selected ? 'border-primary-400 bg-primary-500/20' : 'border-dark-600 hover:border-primary-400'}`}
              >
                {a}
              </button>
            )
          })}
        </div>
      </div>

      {/* Change password section */}
      <div className="bg-dark-900 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold mb-2">Đổi mật khẩu</h2>
        {pwError && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded text-sm">
            {pwError}
          </div>
        )}
        {pwMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-3 py-2 rounded text-sm">
            {pwMessage}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-dark-300">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-3 py-2 rounded bg-dark-800 border border-dark-700 focus:outline-none focus:border-primary-500"
              placeholder="Nhập mật khẩu hiện tại"
              disabled={pwLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-dark-300">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-3 py-2 rounded bg-dark-800 border border-dark-700 focus:outline-none focus:border-primary-500"
              placeholder="Ít nhất 4 ký tự"
              disabled={pwLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-dark-300">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-3 py-2 rounded bg-dark-800 border border-dark-700 focus:outline-none focus:border-primary-500"
              placeholder="Nhập lại để xác nhận"
              disabled={pwLoading}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              setPwError('')
              setPwMessage('')

              if (!currentPassword || !newPassword || !confirmPassword) {
                setPwError('Vui lòng nhập đầy đủ các trường')
                return
              }
              if (newPassword.length < 4) {
                setPwError('Mật khẩu mới phải có ít nhất 4 ký tự')
                return
              }
              if (newPassword !== confirmPassword) {
                setPwError('Mật khẩu mới và xác nhận không khớp')
                return
              }

              try {
                setPwLoading(true)
                await api.post('/user/change-password', {
                  currentPassword,
                  newPassword
                })
                setPwMessage('Đổi mật khẩu thành công')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              } catch (error) {
                const msg = error.response?.data?.error || 'Đổi mật khẩu thất bại'
                setPwError(msg)
              } finally {
                setPwLoading(false)
              }
            }}
            disabled={pwLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pwLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Trophy className="text-yellow-400" />}
          label="Chiến thắng"
          value={user?.total_wins || 0}
        />
        <StatCard 
          icon={<History className="text-blue-400" />}
          label="Tổng races"
          value={user?.total_races || 0}
        />
        <StatCard 
          icon={<TrendingUp className="text-green-400" />}
          label="Tỷ lệ thắng"
          value={`${winRate}%`}
        />
        <StatCard 
          icon={<Coins className="text-primary-400" />}
          label="Tổng giao dịch"
          value={transactions.length}
        />
      </div>

      {/* Tabs */}
      <div className="bg-dark-900 rounded-2xl overflow-hidden">
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === 'transactions' 
                ? 'bg-dark-800 text-primary-400 border-b-2 border-primary-400' 
                : 'text-dark-400 hover:text-white'
            }`}
          >
            💰 Giao dịch
          </button>
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === 'bets' 
                ? 'bg-dark-800 text-primary-400 border-b-2 border-primary-400' 
                : 'text-dark-400 hover:text-white'
            }`}
          >
            🎯 Lịch sử cược
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-4xl animate-bounce inline-block">🐎</span>
              <p className="text-dark-400 mt-2">Đang tải...</p>
            </div>
          ) : activeTab === 'transactions' ? (
            <TransactionList transactions={transactions} />
          ) : (
            <BetList bets={bets} />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-dark-900 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-dark-400 text-sm">{label}</p>
    </div>
  )
}

function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        Chưa có giao dịch nào
      </div>
    )
  }

  const getTypeInfo = (type) => {
    switch (type) {
      case 'daily_reward':
        return { label: 'Thưởng hàng ngày', color: 'text-green-400', icon: '🎁' }
      case 'registration_bonus':
        return { label: 'Thưởng đăng ký', color: 'text-green-400', icon: '🎉' }
      case 'bet_placed':
        return { label: 'Đặt cược', color: 'text-red-400', icon: '🎯' }
      case 'bet_won':
        return { label: 'Thắng cược', color: 'text-green-400', icon: '🏆' }
      case 'bet_refund':
        return { label: 'Hoàn tiền', color: 'text-blue-400', icon: '↩️' }
      default:
        return { label: type, color: 'text-dark-400', icon: '💰' }
    }
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const info = getTypeInfo(tx.type)
        return (
          <div key={i} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">{info.icon}</span>
              <div>
                <p className="font-medium">{info.label}</p>
                <p className="text-xs text-dark-500">
                  {new Date(tx.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <span className={`font-bold ${info.color}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function BetList({ bets }) {
  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        Chưa có lịch sử cược
      </div>
    )
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'won':
        return { label: 'Thắng', color: 'bg-green-500/20 text-green-400' }
      case 'lost':
        return { label: 'Thua', color: 'bg-red-500/20 text-red-400' }
      case 'refunded':
        return { label: 'Hoàn tiền', color: 'bg-blue-500/20 text-blue-400' }
      case 'pending':
        return { label: 'Đang chờ', color: 'bg-yellow-500/20 text-yellow-400' }
      default:
        return { label: status, color: 'bg-dark-700' }
    }
  }

  return (
    <div className="space-y-2">
      {bets.map((bet, i) => {
        const info = getStatusInfo(bet.status)
        return (
          <div key={i} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: bet.horse_color || '#666' }}
              >
                🐎
              </div>
              <div>
                <p className="font-medium">{bet.horse_name}</p>
                <p className="text-xs text-dark-500">
                  Race #{bet.race_id} • {bet.horse_position ? `#${bet.horse_position}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {bet.payout > 0 ? (
                  <span className="text-green-400">+{bet.payout.toLocaleString()}</span>
                ) : (
                  <span className="text-red-400">-{bet.bet_amount.toLocaleString()}</span>
                )}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded ${info.color}`}>
                {info.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Profile
