import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Coins, Play, RefreshCw, Trophy, Plus, X } from 'lucide-react'
import useRaceStore from '../stores/raceStore'
import useAuthStore from '../stores/authStore'
import socketService from '../services/socket'

function Lobby() {
  const { races, fetchActiveRaces, createRace, isLoading } = useRaceStore()
  const { user } = useAuthStore()
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [creating, setCreating] = useState(false)
  
  // Modal states for creating race
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [lobbyName, setLobbyName] = useState('')
  const [registrationTime, setRegistrationTime] = useState(30)
  const [gameMode, setGameMode] = useState('carrot')
  const [maxPlayers, setMaxPlayers] = useState(6)

  async function handleCreateRace() {
    if (creating) return
    
    setCreating(true)
    const result = await createRace(null, registrationTime, lobbyName || null, gameMode, maxPlayers)
    
    if (result.success) {
      alert('Đã tạo cuộc đua thành công!')
      setShowCreateModal(false)
      setLobbyName('')
      setRegistrationTime(30)
      setGameMode('carrot')
      setMaxPlayers(6)
    } else {
      alert(result.error || 'Không thể tạo cuộc đua')
    }
    
    setCreating(false)
  }

  useEffect(() => {
    fetchActiveRaces()

    // Listen for race updates
    const socket = socketService.getSocket()
    if (socket) {
      socket.on('race:created', () => fetchActiveRaces())
      socket.on('race:updated', () => fetchActiveRaces())
      socket.on('race:started', () => fetchActiveRaces())
      socket.on('race:finished', () => fetchActiveRaces())
      socket.on('stats:update', (data) => setOnlineUsers(data.onlineUsers))
      
      socket.emit('stats:request')
    }

    // Refresh every 30s
    const interval = setInterval(fetchActiveRaces, 30000)

    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off('race:created')
        socket.off('race:updated')
        socket.off('race:started')
        socket.off('race:finished')
        socket.off('stats:update')
      }
    }
  }, [fetchActiveRaces])

  const activeRaces = races.filter(r => r.status === 'registration' || r.status === 'running')
  const waitingRaces = races.filter(r => r.status === 'waiting')

  return (
    <div className="space-y-6">
      {/* Create Race Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl p-6 max-w-md w-full border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">🏁 Tạo Cuộc Đua Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-dark-800 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  Tên Lobby (tùy chọn)
                </label>
                <input
                  type="text"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  placeholder="VD: Cuộc đua tốc độ, Race Tối Nay..."
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                  maxLength={50}
                />
                <p className="text-xs text-dark-500 mt-1">
                  Để trống sẽ dùng tên mặc định (Race #ID)
                </p>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  Chế độ chơi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGameMode('carrot')}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      gameMode === 'carrot'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-dark-700 hover:border-green-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">🥕</div>
                    <div className="font-bold">Cà Rốt</div>
                    <div className="text-xs text-dark-400 mt-1">
                      Winner takes all
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('survival')}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      gameMode === 'survival'
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-dark-700 hover:border-red-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">⚔️</div>
                    <div className="font-bold">Sống Còn</div>
                    <div className="text-xs text-dark-400 mt-1">
                      Va chạm đến chết
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    Số người tối đa
                  </label>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Math.max(2, parseInt(e.target.value) || 2))}
                    min={2}
                    placeholder="Tối thiểu 2"
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-dark-500 mt-1">Tối thiểu 2, không giới hạn tối đa</p>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    Thời gian đăng ký (phút)
                  </label>
                  <input
                    type="number"
                    value={registrationTime}
                    onChange={(e) => setRegistrationTime(parseInt(e.target.value) || 30)}
                    min={5}
                    max={120}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateRace}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 text-white rounded-lg font-medium transition"
                >
                  {creating ? '⏳ Đang tạo...' : '✅ Tạo Lobby'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🏇 Lobby</h1>
          <p className="text-dark-400 text-sm sm:text-base">Chọn cuộc đua để tham gia</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Tạo Cuộc Đua</span>
              <span className="xs:hidden">Tạo</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-dark-300 text-sm">
            <Users size={16} className="text-green-400" />
            <span>{onlineUsers} online</span>
          </div>
          <button 
            onClick={fetchActiveRaces}
            className="p-2 hover:bg-dark-800 rounded-lg transition"
            title="Làm mới"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* User stats */}
      <div className="bg-dark-900 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="text-xl sm:text-2xl shrink-0">👋</span>
          <div className="min-w-0">
            <p className="font-bold text-sm sm:text-base truncate">{user?.username}</p>
            <p className="text-xs sm:text-sm text-dark-400">Sẵn sàng đặt cược!</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-dark-800 rounded-lg shrink-0">
          <Coins size={16} className="text-yellow-400" />
          <span className="text-base sm:text-xl font-bold text-yellow-400">
            {user?.coins?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Active Races */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Play className="text-green-400" size={24} />
          Cuộc đua đang mở ({activeRaces.length})
        </h2>
        
        {activeRaces.length === 0 ? (
          <div className="bg-dark-900 rounded-xl p-8 text-center">
            <span className="text-5xl mb-4 block">🏜️</span>
            <p className="text-dark-400">Chưa có cuộc đua nào đang mở</p>
            <p className="text-dark-500 text-sm mt-2">Hãy chờ admin tạo race mới!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {activeRaces.map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </section>

      {/* Waiting Races */}
      {waitingRaces.length > 0 && (
        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="text-yellow-400" size={22} />
            Sắp mở ({waitingRaces.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {waitingRaces.map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="bg-dark-900 rounded-xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Trophy className="text-primary-400" size={20} />
          Thống kê của bạn
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-400">{user?.total_wins || 0}</p>
            <p className="text-dark-400 text-sm">Chiến thắng</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user?.total_races || 0}</p>
            <p className="text-dark-400 text-sm">Tổng races</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {user?.total_races > 0 
                ? Math.round((user.total_wins / user.total_races) * 100) 
                : 0}%
            </p>
            <p className="text-dark-400 text-sm">Tỷ lệ thắng</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function RaceCard({ race }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'registration': return 'bg-green-500'
      case 'running': return 'bg-yellow-500'
      case 'waiting': return 'bg-blue-500'
      default: return 'bg-dark-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'registration': return 'Đang mở'
      case 'running': return 'Đang đua'
      case 'waiting': return 'Chờ mở'
      default: return status
    }
  }

  return (
    <Link 
      to={`/race/${race.id}`}
      className="bg-dark-900 rounded-xl p-5 hover:bg-dark-800 transition block group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(race.status)}`} />
          <span className="text-sm font-medium">{getStatusText(race.status)}</span>
        </div>
        <span className="text-dark-400 text-sm">
          {race.serial || `#${race.id}`}
        </span>
      </div>

      {/* Map Preview */}
      {race.preview_image && (
        <div className="mb-3 rounded-lg overflow-hidden border border-dark-600 bg-dark-700">
          <img 
            src={race.preview_image} 
            alt="Map preview"
            className="w-full object-contain group-hover:scale-105 transition"
            style={{ maxHeight: '150px' }}
          />
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        {!race.preview_image && (
          <span className="text-4xl group-hover:animate-bounce">🐎</span>
        )}
        <div>
          <h3 className="font-bold text-lg">
            {race.name || `Race #${race.id}`}
          </h3>
          <p className="text-dark-400 text-sm">
            Min: {race.minBet?.toLocaleString() || 500} coin
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-dark-300">
          <Users size={16} />
          <span>{race.participants || 0}/{race.maxParticipants || 12}</span>
        </div>
        
        {race.total_pool > 0 && (
          <div className="flex items-center gap-1 text-yellow-400 font-medium">
            <Coins size={16} />
            <span>{race.total_pool?.toLocaleString()}</span>
          </div>
        )}
      </div>

      {race.status === 'registration' && (
        <button className="mt-4 w-full py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-bold transition">
          Tham gia
        </button>
      )}
      
      {race.status === 'running' && (
        <button className="mt-4 w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-bold transition">
          Xem đua
        </button>
      )}
    </Link>
  )
}

export default Lobby
