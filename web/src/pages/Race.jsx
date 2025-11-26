import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Coins, Clock, ArrowLeft, Send, Trophy } from 'lucide-react'
import useRaceStore from '../stores/raceStore'
import useAuthStore from '../stores/authStore'
import socketService from '../services/socket'

function Race() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentRace, participants, fetchRace, joinRace, gameState, clearCurrentRace } = useRaceStore()
  const { user, updateCoins, refreshUser } = useAuthStore()
  
  const [betAmount, setBetAmount] = useState(500)
  const [horseName, setHorseName] = useState('')
  const [horseColor, setHorseColor] = useState('#FF6B6B')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [viewerCount, setViewerCount] = useState(0)
  const [raceResults, setRaceResults] = useState(null)

  const hasJoined = participants.some(p => p.isCurrentUser)

  useEffect(() => {
    fetchRace(id)
    socketService.joinRace(id)

    const socket = socketService.getSocket()
    if (socket) {
      socket.on('race:state', (state) => {
        useRaceStore.getState().setGameState(state)
      })
      
      socket.on('race:updated', (data) => {
        if (data.raceId === parseInt(id)) {
          fetchRace(id)
        }
      })

      socket.on('race:started', (data) => {
        if (data.raceId === parseInt(id)) {
          fetchRace(id)
        }
      })

      socket.on('race:finished', (data) => {
        if (data.raceId === parseInt(id)) {
          setRaceResults(data)
          refreshUser() // Refresh coins
        }
      })

      socket.on('race:viewers', (data) => {
        if (data.raceId === parseInt(id)) {
          setViewerCount(data.count)
        }
      })

      socket.on('chat:message', (msg) => {
        setChatMessages(prev => [...prev.slice(-50), msg])
      })
    }

    return () => {
      socketService.leaveRace(id)
      clearCurrentRace()
      if (socket) {
        socket.off('race:state')
        socket.off('race:updated')
        socket.off('race:started')
        socket.off('race:finished')
        socket.off('race:viewers')
        socket.off('chat:message')
      }
    }
  }, [id, fetchRace, clearCurrentRace, refreshUser])

  const handleJoin = async () => {
    if (betAmount < 500) {
      setJoinError('Cược tối thiểu 500 coin')
      return
    }
    if (betAmount > user.coins) {
      setJoinError('Không đủ coin')
      return
    }

    setIsJoining(true)
    setJoinError('')

    const result = await joinRace(id, {
      horseName: horseName || `${user.username}'s Horse`,
      horseColor,
      betAmount
    })

    setIsJoining(false)

    if (result.success) {
      updateCoins(result.newBalance)
      fetchRace(id)
    } else {
      setJoinError(result.error)
    }
  }

  const sendChat = () => {
    if (chatInput.trim()) {
      socketService.sendChat(parseInt(id), chatInput.trim())
      setChatInput('')
    }
  }

  if (!currentRace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="text-4xl animate-bounce">🐎</span>
      </div>
    )
  }

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

  return (
    <div className="space-y-6">
      {/* Results Modal */}
      {raceResults && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl p-6 max-w-md w-full animate-slideIn">
            <div className="text-center mb-6">
              <Trophy size={50} className="text-yellow-400 mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Kết quả!</h2>
            </div>
            
            <div className="space-y-3">
              {raceResults.results?.slice(0, 5).map((r, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i === 0 ? 'bg-yellow-500/20 border border-yellow-500' :
                    i === 1 ? 'bg-gray-400/20 border border-gray-400' :
                    i === 2 ? 'bg-orange-500/20 border border-orange-500' :
                    'bg-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div>
                      <p className="font-bold">{r.horse_name}</p>
                      <p className="text-sm text-dark-400">@{r.username}</p>
                    </div>
                  </div>
                  {r.payout > 0 && (
                    <span className="text-yellow-400 font-bold">+{r.payout.toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setRaceResults(null)
                navigate('/lobby')
              }}
              className="mt-6 w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-bold"
            >
              Về Lobby
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/lobby')}
          className="p-2 hover:bg-dark-800 rounded-lg"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Race #{currentRace.id}</h1>
          <div className="flex items-center gap-4 text-sm text-dark-400">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              currentRace.status === 'registration' ? 'bg-green-500/20 text-green-400' :
              currentRace.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-dark-700'
            }`}>
              {currentRace.status === 'registration' ? 'Đang mở đăng ký' :
               currentRace.status === 'running' ? 'Đang đua' : currentRace.status}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {viewerCount} xem
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-900 rounded-lg">
          <Coins size={18} className="text-yellow-400" />
          <span className="font-bold">{currentRace.total_pool?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game viewer */}
          <div className="bg-dark-900 rounded-xl overflow-hidden">
            <div className="aspect-video bg-dark-950 flex items-center justify-center">
              {currentRace.status === 'running' && gameState ? (
                <div className="w-full h-full">
                  {/* TODO: Render game canvas here */}
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl horse-running">🐎</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-6xl mb-4 block">🏇</span>
                  <p className="text-dark-400">
                    {currentRace.status === 'registration' 
                      ? 'Đang chờ người chơi...' 
                      : 'Race chưa bắt đầu'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-dark-900 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Users size={18} />
              Người tham gia ({participants.length}/12)
            </h3>
            {participants.length === 0 ? (
              <p className="text-dark-400 text-center py-4">Chưa có ai tham gia</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {participants.map((p, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg text-center ${
                      p.isCurrentUser ? 'bg-primary-500/20 border border-primary-500' : 'bg-dark-800'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-xl"
                      style={{ backgroundColor: p.horse_color }}
                    >
                      🐎
                    </div>
                    <p className="font-medium text-sm truncate">{p.horse_name}</p>
                    <p className="text-dark-400 text-xs">@{p.username}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Join form */}
          {currentRace.status === 'registration' && !hasJoined && (
            <div className="bg-dark-900 rounded-xl p-4">
              <h3 className="font-bold mb-4">🎯 Tham gia đua</h3>
              
              {joinError && (
                <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-3">
                  {joinError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Tên ngựa</label>
                  <input
                    type="text"
                    value={horseName}
                    onChange={(e) => setHorseName(e.target.value)}
                    placeholder={`${user?.username}'s Horse`}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Màu ngựa</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setHorseColor(c)}
                        className={`w-8 h-8 rounded-full transition ${
                          horseColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dark-400 mb-1 block">
                    Số coin cược (Min: 500)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(500, parseInt(e.target.value) || 500))}
                    min={500}
                    max={user?.coins}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    Bạn có: {user?.coins?.toLocaleString()} coin
                  </p>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining || betAmount > user?.coins}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 rounded-lg font-bold transition"
                >
                  {isJoining ? '⏳ Đang xử lý...' : `Đặt cược ${betAmount.toLocaleString()} coin`}
                </button>
              </div>
            </div>
          )}

          {/* Already joined */}
          {hasJoined && (
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 text-center">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="font-bold text-green-400">Bạn đã tham gia!</p>
              <p className="text-sm text-dark-300 mt-1">Chờ race bắt đầu...</p>
            </div>
          )}

          {/* Chat */}
          <div className="bg-dark-900 rounded-xl p-4">
            <h3 className="font-bold mb-3">💬 Chat</h3>
            <div className="h-48 overflow-y-auto bg-dark-950 rounded-lg p-2 mb-3 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-dark-500 text-center text-sm py-4">Chưa có tin nhắn</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-primary-400 font-medium">{msg.username}: </span>
                    <span className="text-dark-200">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none text-sm"
                maxLength={100}
              />
              <button
                onClick={sendChat}
                className="px-3 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Race
