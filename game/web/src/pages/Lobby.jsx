import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Coins, Play, RefreshCw, Trophy } from 'lucide-react'
import useRaceStore from '../stores/raceStore'
import useAuthStore from '../stores/authStore'
import socketService from '../services/socket'

function Lobby() {
  const { races, fetchActiveRaces, isLoading } = useRaceStore()
  const { user } = useAuthStore()
  const [onlineUsers, setOnlineUsers] = useState(0)

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏇 Lobby</h1>
          <p className="text-dark-400">Chọn cuộc đua để tham gia</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-dark-300">
            <Users size={18} className="text-green-400" />
            <span>{onlineUsers} online</span>
          </div>
          <button 
            onClick={fetchActiveRaces}
            className="p-2 hover:bg-dark-800 rounded-lg transition"
            title="Làm mới"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* User stats */}
      <div className="bg-dark-900 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">👋</span>
          <div>
            <p className="font-bold">{user?.username}</p>
            <p className="text-sm text-dark-400">Sẵn sàng đặt cược!</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg">
          <Coins size={20} className="text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">
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
          <div className="grid md:grid-cols-2 gap-4">
            {activeRaces.map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </section>

      {/* Waiting Races */}
      {waitingRaces.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="text-yellow-400" size={24} />
            Sắp mở ({waitingRaces.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-3 gap-4 text-center">
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
        <span className="text-dark-400 text-sm">#{race.id}</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl group-hover:animate-bounce">🐎</span>
        <div>
          <h3 className="font-bold text-lg">Race #{race.id}</h3>
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
