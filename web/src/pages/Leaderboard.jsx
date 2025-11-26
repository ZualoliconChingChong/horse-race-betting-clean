import { useEffect, useState } from 'react'
import { Trophy, Medal, Coins, TrendingUp } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../stores/authStore'

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/user/leaderboard')
        setLeaderboard(response.data.leaderboard || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      }
      setIsLoading(false)
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="text-4xl animate-bounce">🏆</span>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy className="text-yellow-400" size={36} />
          Bảng xếp hạng
        </h1>
        <p className="text-dark-400 mt-2">Top người chơi có nhiều chiến thắng nhất</p>
      </div>

      {/* Top 3 */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-4 py-8">
          {/* 2nd place */}
          {top3[1] && (
            <TopPlayer 
              player={top3[1]} 
              rank={2} 
              isCurrentUser={user?.id === top3[1].id}
            />
          )}
          
          {/* 1st place */}
          {top3[0] && (
            <TopPlayer 
              player={top3[0]} 
              rank={1} 
              isCurrentUser={user?.id === top3[0].id}
            />
          )}
          
          {/* 3rd place */}
          {top3[2] && (
            <TopPlayer 
              player={top3[2]} 
              rank={3} 
              isCurrentUser={user?.id === top3[2].id}
            />
          )}
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="bg-dark-900 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-dark-800 font-medium text-dark-400 text-sm">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Người chơi</div>
          <div className="col-span-2 text-center">Thắng</div>
          <div className="col-span-2 text-center">Races</div>
          <div className="col-span-2 text-right">Coins</div>
        </div>

        {rest.length === 0 && top3.length === 0 ? (
          <div className="p-8 text-center text-dark-400">
            Chưa có dữ liệu xếp hạng
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {rest.map((player, i) => {
              const rank = i + 4
              const isCurrentUser = user?.id === player.id
              const winRate = player.total_races > 0 
                ? Math.round((player.total_wins / player.total_races) * 100) 
                : 0

              return (
                <div 
                  key={player.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center ${
                    isCurrentUser ? 'bg-primary-500/10' : 'hover:bg-dark-800'
                  } transition`}
                >
                  <div className="col-span-1 font-bold text-dark-400">
                    {rank}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center">
                      🐎
                    </div>
                    <div>
                      <p className={`font-medium ${isCurrentUser ? 'text-primary-400' : ''}`}>
                        {player.username}
                        {isCurrentUser && <span className="text-xs ml-2">(Bạn)</span>}
                      </p>
                      <p className="text-xs text-dark-500">
                        Tỷ lệ thắng: {winRate}%
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-yellow-400">{player.total_wins}</span>
                  </div>
                  <div className="col-span-2 text-center text-dark-400">
                    {player.total_races}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="flex items-center justify-end gap-1 text-yellow-400">
                      <Coins size={14} />
                      {player.coins?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TopPlayer({ player, rank, isCurrentUser }) {
  const getRankStyle = (r) => {
    switch (r) {
      case 1:
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-400',
          icon: '🥇',
          height: 'h-32',
          size: 'text-4xl'
        }
      case 2:
        return {
          bg: 'bg-gray-400',
          text: 'text-gray-300',
          icon: '🥈',
          height: 'h-24',
          size: 'text-3xl'
        }
      case 3:
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-400',
          icon: '🥉',
          height: 'h-20',
          size: 'text-3xl'
        }
      default:
        return {
          bg: 'bg-dark-700',
          text: 'text-dark-400',
          icon: '',
          height: 'h-16',
          size: 'text-2xl'
        }
    }
  }

  const style = getRankStyle(rank)
  const winRate = player.total_races > 0 
    ? Math.round((player.total_wins / player.total_races) * 100) 
    : 0

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}>
      <div className={`${style.size} mb-2`}>{style.icon}</div>
      
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2
        ${isCurrentUser ? 'ring-4 ring-primary-500' : ''}
        ${style.bg}
      `}>
        🐎
      </div>
      
      <p className={`font-bold ${isCurrentUser ? 'text-primary-400' : ''}`}>
        {player.username}
      </p>
      
      <div className="flex items-center gap-1 text-yellow-400 font-bold mt-1">
        <Trophy size={16} />
        {player.total_wins}
      </div>
      
      <p className="text-xs text-dark-500 mt-1">
        {winRate}% win rate
      </p>
      
      <div className={`${style.height} w-24 ${style.bg} rounded-t-lg mt-4 flex items-end justify-center pb-2`}>
        <span className="text-2xl font-bold text-white">#{rank}</span>
      </div>
    </div>
  )
}

export default Leaderboard
