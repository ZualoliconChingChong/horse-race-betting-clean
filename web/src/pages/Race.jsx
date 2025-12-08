import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Coins, Clock, Trophy, ArrowLeft, Trash2, X, XCircle } from 'lucide-react'
import useRaceStore from '../stores/raceStore'
import useAuthStore from '../stores/authStore'
import api from '../services/api'
import PayoutTable from '../components/PayoutTable'

// Skill descriptions for tooltips
const skillDescriptions = {
  none: "Không có kỹ năng đặc biệt",
  hunter: "RAM 15s, TIÊU DIỆT ngựa va chạm. Không giết ai = -50% tốc độ. CD: 90s",
  guardian: "Khiên vĩnh viễn chặn 1 hiệu ứng tiêu cực. Kích hoạt ngay. CD: 60s",
  phantom_strike: "Bóng ma 5s, xuyên qua ngựa, có thể tấn công khi vô hình. CD: 85s",
  cosmic_swap: "Đóng băng TẤT CẢ ngựa 1s, dịch chuyển đến ngựa xa nhất. CD: 80s",
  chain_lightning: "Sét nhảy 4 ngựa, choáng 2.5s + chậm 55% trong 3.5s. CD: 42s",
  gravity_well: "Vùng hấp dẫn (150 bán kính) kéo ngựa khác về trong 5s. CD: 45s",
  chill_guy: "THỤ ĐỘNG: Miễn nhiễm boost và ghost pickup",
  overdrive: "+60% tốc độ 5s, sau đó quá nhiệt -25% tốc độ 5s. CD: 50s",
  slipstream: "+40% tốc độ 6s, để lại vệt khí +25% cho ngựa đi sau. CD: 55s",
  shockwave: "Vòng sóng 7s đẩy lùi và -30% tốc độ ngựa tại vành sóng. CD: 45s",
  oguri_fat: "x2 tốc độ, x1.5 sát thương va chạm, aura lửa 5s. CD: 60s",
  silence_shizuka: "Aura xanh hồi 5 HP/giây trong 10s (tổng 50 HP). CD: 45s",
  fireball: "3 quả cầu lửa xoay quanh 8s, va chạm gây -10 HP. CD: 40s"
}

export default function RaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentRace, participants, fetchRace, joinRace } = useRaceStore()
  const { user, refreshUser } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [joinModal, setJoinModal] = useState(false)
  const [userHorses, setUserHorses] = useState([])
  const [selectedHorse, setSelectedHorse] = useState(null)
  const [betAmount, setBetAmount] = useState(500)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deletingBetId, setDeletingBetId] = useState(null)
  const [closingRace, setClosingRace] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editNameModal, setEditNameModal] = useState(false)
  const [newRaceName, setNewRaceName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [previewBetAmount, setPreviewBetAmount] = useState(500)
  const [editBetModal, setEditBetModal] = useState(false)
  const [editBetAmount, setEditBetAmount] = useState(500)
  const [updatingBet, setUpdatingBet] = useState(false)

  useEffect(() => {
    loadRaceData()
  }, [id])

  async function loadRaceData() {
    setLoading(true)
    await fetchRace(id)
    
    // Load user's horses
    try {
      const res = await api.get('/horses/my')
      setUserHorses(res.data.horses || [])
      if (res.data.activeHorse) {
        setSelectedHorse(res.data.activeHorse.id)
      }
    } catch (err) {
      console.error('Failed to load horses:', err)
    }
    
    setLoading(false)
  }

  async function handleJoinRace() {
    if (!selectedHorse) {
      setError('Vui lòng chọn ngựa để tham gia')
      return
    }

    if (betAmount < (currentRace?.minBet || 500)) {
      setError(`Số tiền cược tối thiểu là ${currentRace?.minBet || 500} coins`)
      return
    }

    setSubmitting(true)
    setError('')
    
    const result = await joinRace(id, {
      userHorseId: selectedHorse,
      betAmount
    })

    if (result.success) {
      setMessage('Đã đăng ký tham gia thành công!')
      setJoinModal(false)
      await loadRaceData()
      refreshUser()
    } else {
      setError(result.error)
    }
    
    setSubmitting(false)
  }

  function handleStartRaceDirectly() {
    // Open race-launcher directly - it will load saved config from server
    const params = new URLSearchParams({
      raceId: currentRace.id,
      v: Date.now()
    })
    
    window.open(`/race-launcher.html?${params.toString()}`, '_blank')
  }

  async function handleLeaveLobby(betId, participantName = '') {
    const isKicking = user?.is_admin && participantName
    const confirmMsg = isKicking
      ? `Bạn có chắc muốn kick ${participantName}? Số tiền cược sẽ được hoàn lại cho họ.`
      : 'Bạn có chắc muốn rời khỏi cuộc đua? Số tiền cược sẽ được hoàn lại.'
    
    if (!window.confirm(confirmMsg)) {
      return
    }

    setDeletingBetId(betId)
    try {
      await api.delete(`/race/${id}/bet/${betId}`)
      const msg = isKicking
        ? `Đã kick ${participantName} và hoàn tiền`
        : 'Đã rời khỏi cuộc đua và hoàn lại tiền cược'
      setMessage(msg)
      await loadRaceData()
      refreshUser()
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể thực hiện')
    } finally {
      setDeletingBetId(null)
    }
  }

  async function handleUpdateRaceName() {
    if (updatingName) return
    
    try {
      setUpdatingName(true)
      setError('')
      
      await api.put(`/race/${id}/name`, { name: newRaceName || null })
      
      setMessage('✅ Đã cập nhật tên lobby!')
      setEditNameModal(false)
      setNewRaceName('')
      await loadRaceData()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể cập nhật tên')
    } finally {
      setUpdatingName(false)
    }
  }

  async function handleUpdateBet() {
    if (updatingBet) return
    
    const userBet = participants.find(p => p.isCurrentUser)
    if (!userBet) return
    
    if (editBetAmount === userBet.bet_amount) {
      setEditBetModal(false)
      return
    }
    
    try {
      setUpdatingBet(true)
      setError('')
      
      const response = await api.put(`/race/${id}/bet`, { newAmount: editBetAmount })
      
      const diff = response.data.difference
      const diffText = diff > 0 
        ? `+${diff.toLocaleString()} coins` 
        : `${diff.toLocaleString()} coins (hoàn lại)`
      
      setMessage(`✅ Đã đổi cược: ${response.data.oldAmount.toLocaleString()} → ${response.data.newAmount.toLocaleString()} (${diffText})`)
      setEditBetModal(false)
      await loadRaceData()
      refreshUser()
      
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể cập nhật số tiền cược')
    } finally {
      setUpdatingBet(false)
    }
  }

  function openEditBetModal() {
    const userBet = participants.find(p => p.isCurrentUser)
    if (userBet) {
      setEditBetAmount(userBet.bet_amount)
      setEditBetModal(true)
    }
  }

  async function handleCloseRace() {
    if (!window.confirm('Bạn có chắc muốn đóng/hủy cuộc đua này? Tất cả người chơi sẽ được hoàn tiền.')) {
      return
    }

    setClosingRace(true)
    try {
      const res = await api.post(`/race/${id}/close`)
      setMessage(res.data.message || 'Đã đóng cuộc đua và hoàn tiền cho tất cả người chơi')
      await loadRaceData()
      refreshUser()
      // Redirect to lobby after 2 seconds
      setTimeout(() => navigate('/lobby'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể đóng cuộc đua')
    } finally {
      setClosingRace(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="text-4xl animate-bounce">🐎</div>
        <p className="text-gray-400 mt-4">Đang tải...</p>
      </div>
    )
  }

  if (!currentRace) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-400">Không tìm thấy cuộc đua</p>
        <button
          onClick={() => navigate('/lobby')}
          className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg"
        >
          Về Lobby
        </button>
      </div>
    )
  }

  const userJoined = participants.some(p => p.isCurrentUser)
  const isFull = participants.length >= (currentRace.maxParticipants || 12)
  const canJoin = currentRace.status === 'registration' && !userJoined && !isFull && userHorses.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Edit Name Modal */}
      {editNameModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl p-6 max-w-md w-full border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">✏️ Đổi Tên Lobby</h3>
              <button
                onClick={() => {
                  setEditNameModal(false)
                  setNewRaceName('')
                }}
                className="p-1 hover:bg-dark-800 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-dark-400 mb-2">
                Tên mới (để trống = tên mặc định)
              </label>
              <input
                type="text"
                value={newRaceName}
                onChange={(e) => setNewRaceName(e.target.value)}
                placeholder={`Race #${currentRace?.id}`}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:border-primary-500 outline-none"
                maxLength={50}
                disabled={updatingName}
              />
              <p className="text-xs text-dark-500 mt-1">
                Serial: {currentRace?.serial || 'N/A'}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpdateRaceName}
                disabled={updatingName}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 text-white rounded-lg font-medium transition"
              >
                {updatingName ? '⏳ Đang lưu...' : '💾 Lưu'}
              </button>
              <button
                onClick={() => {
                  setEditNameModal(false)
                  setNewRaceName('')
                }}
                disabled={updatingName}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/lobby')}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          Về Lobby
        </button>
        <span className="text-gray-500">Race #{currentRace.id}</span>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* Race Info */}
      <div className="bg-dark-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Race #{currentRace.id}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                currentRace.game_mode === 'survival' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/50'
              }`}>
                {currentRace.game_mode === 'survival' ? '⚔️ Sống Còn' : '🥕 Cà Rốt'}
              </span>
            </div>
            {currentRace.name && (
              <p className="text-gray-400 mt-1">{currentRace.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentRace.status} />
            {/* Creator or Admin can manage race */}
            {(user?.is_admin || currentRace.created_by === user?.id) && currentRace.status === 'registration' && (
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/game/index.html?editor=true&raceId=${currentRace.id}`, '_blank')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  ✏️ Editor
                </button>
                <button
                  onClick={() => {
                    setNewRaceName(currentRace?.name || '')
                    setEditNameModal(true)
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  ✏️ Đổi Tên
                </button>
                {/* Only Admin can Start Race */}
                {user?.is_admin && participants.length >= 2 && (
                  <button
                    onClick={handleStartRaceDirectly}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                  >
                    🏁 Start Race
                  </button>
                )}
                <button
                  onClick={handleCloseRace}
                  disabled={closingRace}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2"
                  title="Đóng/Hủy cuộc đua"
                >
                  {closingRace ? (
                    <Clock size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Đóng Lobby
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Map Preview */}
        {currentRace.preview_image && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🗺️ Map Preview
            </h3>
            <div className="relative bg-dark-800 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setShowPreviewModal(true)}>
              <img 
                src={currentRace.preview_image} 
                alt="Map Preview"
                className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-4 py-2 rounded-lg text-sm font-medium">
                  🔍 Click để xem full size
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard icon={<Users />} label="Người chơi" value={`${participants.length}/${currentRace.maxParticipants || 12}`} />
          <InfoCard icon={<Coins className="text-yellow-400" />} label="Tổng giải" value={currentRace.total_pool?.toLocaleString() || '0'} />
          <InfoCard icon={<Coins className="text-primary-400" />} label="Cược tối thiểu" value={currentRace.minBet?.toLocaleString() || '500'} />
          <InfoCard icon={<Trophy className="text-yellow-400" />} label="Trạng thái" value={getStatusText(currentRace.status)} />
        </div>

        {canJoin && (
          <button
            onClick={() => setJoinModal(true)}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition"
          >
            Tham gia đua
          </button>
        )}

        {userJoined && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded text-center font-medium">
            ✓ Bạn đã đăng ký tham gia cuộc đua này
          </div>
        )}

        {isFull && !userJoined && (
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 px-4 py-3 rounded text-center">
            Cuộc đua đã đầy
          </div>
        )}

        {userHorses.length === 0 && currentRace.status === 'registration' && (
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 px-4 py-3 rounded text-center">
            Bạn cần tạo ngựa trước khi tham gia. <a href="/my-horse" className="underline">Tạo ngựa ngay</a>
          </div>
        )}
      </div>

      {/* Live Payout Table */}
      <div className="bg-dark-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {currentRace.game_mode === 'survival' ? '📊 Bảng thưởng Realtime' : '🥕 Bảng thưởng Cà Rốt'}
            {currentRace.game_mode === 'survival' && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </h2>
          <span className="text-sm text-gray-500">
            {participants.length}/{currentRace.max_players || 6} người
          </span>
        </div>

        {/* Bet Amount Calculator */}
        <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <label className="block text-sm text-gray-400 mb-2">
            💰 Nhập số tiền để xem preview:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={previewBetAmount}
              onChange={(e) => setPreviewBetAmount(Math.max(100, parseInt(e.target.value) || 500))}
              min={100}
              className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-yellow-400 font-bold text-lg focus:border-primary-500 outline-none"
            />
            <span className="text-gray-500">coins</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[500, 1000, 5000, 10000].map(amount => (
              <button
                key={amount}
                onClick={() => setPreviewBetAmount(amount)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  previewBetAmount === amount 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        
        {currentRace.game_mode === 'survival' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bảng theo max players */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">
                📋 Nếu đủ {currentRace.max_players || 6} người:
              </h3>
              <PayoutTable 
                mode="survival" 
                betAmount={previewBetAmount}
                totalPlayers={currentRace.max_players || 6}
                compact={true}
              />
            </div>
            
            {/* Bảng theo số người hiện tại */}
            {participants.length >= 2 && (
              <div>
                <h3 className="text-sm font-bold text-yellow-400 mb-2">
                  ⚡ Với {participants.length} người hiện tại:
                </h3>
                <PayoutTable 
                  mode="survival" 
                  betAmount={previewBetAmount}
                  totalPlayers={participants.length}
                  compact={true}
                />
              </div>
            )}
          </div>
        ) : (
          <PayoutTable 
            mode="carrot" 
            betAmount={previewBetAmount}
            compact={true}
          />
        )}
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          * Tỷ lệ % giữ nguyên với mọi mức cược
        </p>
      </div>

      {/* Participants */}
      <div className="bg-dark-900 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Danh sách tham gia ({participants.length})</h2>
        
        {participants.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có người tham gia</p>
        ) : (
          <div className="space-y-3">
            {participants.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 transition">
                {/* Horse Avatar */}
                <div className="relative">
                  <img 
                    src={`/assets/horses/${p.horse_sprite}.png`}
                    alt={p.horse_name}
                    className="w-20 h-20 object-contain bg-dark-700 rounded-lg border-2 border-dark-600"
                  />
                  {p.horse_label_color && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-dark-800"
                      style={{ backgroundColor: p.horse_label_color }}
                      title={`Màu label: ${p.horse_label_color}`}
                    />
                  )}
                </div>
                
                {/* Horse Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white text-lg truncate">{p.horse_name}</p>
                    {p.isCurrentUser && (
                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded font-medium">YOU</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    Chủ: <span className="text-gray-300">{p.username}</span>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Coins size={12} className="text-yellow-400" />
                      Cược: <span className="text-yellow-400 font-medium">{p.bet_amount?.toLocaleString() || '0'}</span>
                      {p.isCurrentUser && currentRace.status === 'registration' && (
                        <button
                          onClick={openEditBetModal}
                          className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-[10px] font-medium transition"
                        >
                          ✏️ Sửa
                        </button>
                      )}
                    </span>
                    {p.horse_skill && (
                      <span 
                        className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-medium cursor-help"
                        title={skillDescriptions[p.skill_key] || p.horse_skill}
                      >
                        ⚡ {p.horse_skill}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result or Actions */}
                {currentRace.status === 'finished' && p.horse_position ? (
                  <div className="text-right">
                    <div className="text-3xl mb-1">
                      {p.horse_position === 1 ? '🥇' : p.horse_position === 2 ? '🥈' : p.horse_position === 3 ? '🥉' : `#${p.horse_position}`}
                    </div>
                    {p.payout > 0 && (
                      <p className="text-green-400 font-bold text-sm">+{p.payout.toLocaleString()}</p>
                    )}
                  </div>
                ) : currentRace.status === 'registration' && (p.isCurrentUser || user?.is_admin) && (
                  <button
                    onClick={() => handleLeaveLobby(p.bet_id, p.isCurrentUser ? '' : p.username)}
                    disabled={deletingBetId === p.bet_id}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                    title={p.isCurrentUser ? 'Rời khỏi cuộc đua' : `Kick ${p.username}`}
                  >
                    {deletingBetId === p.bet_id ? (
                      <Clock size={20} className="animate-spin" />
                    ) : (
                      <>
                        <X size={20} />
                        {user?.is_admin && !p.isCurrentUser && (
                          <span className="text-xs">Kick</span>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {joinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Chọn ngựa tham gia</h2>
              <button
                onClick={() => setJoinModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Horse Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Chọn ngựa của bạn
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userHorses.map((horse) => {
                  const isSelected = selectedHorse === horse.id
                  return (
                    <button
                      key={horse.id}
                      onClick={() => setSelectedHorse(horse.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/20'
                          : 'border-dark-700 hover:border-primary-400'
                      }`}
                    >
                      <img 
                        src={`/assets/horses/${horse.sprite_key}.png`}
                        alt={horse.horse_name}
                        className="w-16 h-16 object-contain bg-dark-800 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{horse.horse_name}</p>
                          {horse.is_active === 1 && (
                            <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-xs text-purple-400">⚡ {horse.skill_key}</p>
                        <p className="text-[10px] text-gray-500 truncate" title={skillDescriptions[horse.skill_key]}>
                          {skillDescriptions[horse.skill_key] || ''}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payout Structure */}
            <div className="mb-6 space-y-4">
              {/* Bảng 1: Theo số người tối đa */}
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-2">
                  📊 Bảng thưởng (Tối đa {currentRace.max_players || 6} người)
                </h4>
                <PayoutTable 
                  mode={currentRace.game_mode || 'carrot'} 
                  betAmount={betAmount}
                  totalPlayers={currentRace.max_players || 6}
                />
              </div>

              {/* Bảng 2: Mô phỏng theo số người hiện tại (nếu > 2) */}
              {participants.length >= 2 && participants.length + 1 !== (currentRace.max_players || 6) && (
                <div className="border-t border-dark-700 pt-4">
                  <h4 className="text-sm font-bold text-yellow-400 mb-2">
                    ⚡ Mô phỏng với {participants.length + 1} người (bạn + {participants.length} đã đăng ký)
                  </h4>
                  <PayoutTable 
                    mode={currentRace.game_mode || 'carrot'} 
                    betAmount={betAmount}
                    totalPlayers={participants.length + 1}
                  />
                </div>
              )}
            </div>

            {/* Bet Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Số tiền cược (tối thiểu: {currentRace.minBet?.toLocaleString()} coins)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                min={currentRace.minBet || 500}
                step={100}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số dư: {user?.coins?.toLocaleString()} coins
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setJoinModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={handleJoinRace}
                disabled={submitting || !selectedHorse}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                {submitting ? 'Đang xử lý...' : `Tham gia (-${betAmount.toLocaleString()} coins)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Preview Modal */}
      {showPreviewModal && currentRace.preview_image && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] bg-dark-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl transition"
            >
              ×
            </button>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-4 text-center">🗺️ Map Preview - Race #{currentRace.id}</h3>
              <div className="bg-dark-800 rounded-lg overflow-auto max-h-[70vh] flex items-center justify-center">
                <img 
                  src={currentRace.preview_image} 
                  alt="Map Preview Full Size"
                  className="max-w-full h-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <p className="text-center text-gray-400 text-sm mt-4">
                Click bên ngoài hoặc nút × để đóng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bet Modal */}
      {editBetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              ✏️ Sửa số tiền cược
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Số tiền cược mới:
              </label>
              <input
                type="number"
                value={editBetAmount}
                onChange={(e) => setEditBetAmount(Math.max(100, parseInt(e.target.value) || 100))}
                min={100}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-yellow-400 font-bold text-xl focus:border-primary-500 outline-none"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[500, 1000, 2000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setEditBetAmount(amount)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    editBetAmount === amount 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Difference preview */}
            {(() => {
              const userBet = participants.find(p => p.isCurrentUser)
              const oldAmount = userBet?.bet_amount || 0
              const diff = editBetAmount - oldAmount
              
              if (diff === 0) return null
              
              return (
                <div className={`p-3 rounded-lg mb-4 ${diff > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                  <p className="text-sm">
                    {diff > 0 ? (
                      <span className="text-red-400">
                        💸 Sẽ trừ thêm: <strong>{diff.toLocaleString()}</strong> coins
                      </span>
                    ) : (
                      <span className="text-green-400">
                        💰 Sẽ hoàn lại: <strong>{Math.abs(diff).toLocaleString()}</strong> coins
                      </span>
                    )}
                  </p>
                </div>
              )
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setEditBetModal(false)}
                disabled={updatingBet}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateBet}
                disabled={updatingBet}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                {updatingBet ? '⏳ Đang cập nhật...' : '✅ Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const getStyle = () => {
    switch (status) {
      case 'registration':
        return 'bg-green-500/20 text-green-400 border-green-500'
      case 'running':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
      case 'finished':
        return 'bg-blue-500/20 text-blue-400 border-blue-500'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500'
    }
  }

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStyle()}`}>
      {getStatusText(status)}
    </span>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-dark-800 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function getStatusText(status) {
  switch (status) {
    case 'registration': return 'Đang mở'
    case 'running': return 'Đang đua'
    case 'finished': return 'Đã kết thúc'
    case 'waiting': return 'Chờ mở'
    default: return status
  }
}







