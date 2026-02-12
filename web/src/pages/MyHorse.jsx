import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import api from '../services/api'

const CREATION_FEE = 100 // Must match backend

export default function MyHorse() {
  const { user, refreshUser } = useAuthStore()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Multiple horses
  const [horses, setHorses] = useState([])
  const [activeHorse, setActiveHorse] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingHorse, setEditingHorse] = useState(null)
  
  // Form data
  const [horseName, setHorseName] = useState('')
  const [spriteKey, setSpriteKey] = useState('')
  const [skillKey, setSkillKey] = useState('')
  const [labelColor, setLabelColor] = useState('') // Custom label color
  
  // Options from backend
  const [sprites, setSprites] = useState([])
  const [skills, setSkills] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user, navigate])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load options
      const optionsRes = await api.get('/horses/options')
      setSprites(optionsRes.data.sprites || [])
      setSkills(optionsRes.data.skills || [])
      
      // Load user's horses
      const horsesRes = await api.get('/horses/my')
      const fetchedHorses = horsesRes.data.horses || []
      const fetchedActive = horsesRes.data.activeHorse || null
      
      setHorses(fetchedHorses)
      setActiveHorse(fetchedActive)
      
      // Set defaults for form
      if (optionsRes.data.sprites.length > 0) {
        setSpriteKey(optionsRes.data.sprites[0].key)
      }
      if (optionsRes.data.skills.length > 0) {
        setSkillKey(optionsRes.data.skills[0].key)
      }
      
    } catch (err) {
      console.error('Failed to load horse data:', err)
      setError('Không thể tải dữ liệu ngựa')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateHorse() {
    setMessage('')
    setError('')
    
    if (!horseName || horseName.trim().length === 0) {
      setError('Vui lòng nhập tên ngựa')
      return
    }
    
    if (horseName.length > 30) {
      setError('Tên ngựa không được quá 30 ký tự')
      return
    }
    
    if (!spriteKey || !skillKey) {
      setError('Vui lòng chọn sprite và skill')
      return
    }
    
    // Confirm fee if not first horse
    if (horses.length > 0) {
      if (!window.confirm(`Tạo ngựa mới sẽ tốn ${CREATION_FEE} coins. Bạn có chắc?`)) {
        return
      }
    }
    
    try {
      setSaving(true)
      const res = await api.post('/horses/my', {
        horseName: horseName.trim(),
        spriteKey,
        skillKey,
        labelColor: labelColor || undefined // Send only if provided
      })
      
      setHorses(res.data.horses || [])
      setActiveHorse(res.data.horses?.find(h => h.is_active === 1) || null)
      setMessage(res.data.message || 'Đã tạo ngựa thành công!')
      setShowCreateForm(false)
      setHorseName('')
      setLabelColor('')
      
      // Refresh user coins if charged
      if (res.data.charged > 0) {
        refreshUser()
      }
      
    } catch (err) {
      const msg = err.response?.data?.error || 'Không thể tạo ngựa'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateHorse() {
    if (!editingHorse) return
    
    setMessage('')
    setError('')
    
    if (!horseName || horseName.trim().length === 0) {
      setError('Vui lòng nhập tên ngựa')
      return
    }
    
    try {
      setSaving(true)
      const res = await api.put(`/horses/my/${editingHorse.id}`, {
        horseName: horseName.trim(),
        spriteKey,
        skillKey,
        labelColor: labelColor || undefined
      })
      
      // Update local state
      setHorses(prev => prev.map(h => h.id === editingHorse.id ? res.data.horse : h))
      if (activeHorse && activeHorse.id === editingHorse.id) {
        setActiveHorse(res.data.horse)
      }
      
      setMessage('Đã cập nhật ngựa')
      setEditingHorse(null)
      setHorseName('')
      setLabelColor('')
      
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể cập nhật ngựa')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetActive(horseId) {
    try {
      const res = await api.post(`/horses/my/${horseId}/activate`)
      setHorses(res.data.horses || [])
      setActiveHorse(res.data.activeHorse)
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể chọn ngựa')
    }
  }

  async function handleDeleteHorse(horse) {
    if (!window.confirm(`Xóa ngựa "${horse.horse_name}"? Hành động này không thể hoàn tác.`)) {
      return
    }
    
    try {
      const res = await api.delete(`/horses/my/${horse.id}`)
      setHorses(res.data.horses || [])
      setActiveHorse(res.data.horses?.find(h => h.is_active === 1) || null)
      setMessage('Đã xóa ngựa')
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể xóa ngựa')
    }
  }

  function openEditForm(horse) {
    setEditingHorse(horse)
    setHorseName(horse.horse_name)
    setSpriteKey(horse.sprite_key)
    setSkillKey(horse.skill_key)
    setLabelColor(horse.label_color || '')
    setShowCreateForm(true)
    setMessage('')
    setError('')
  }

  function closeForm() {
    setShowCreateForm(false)
    setEditingHorse(null)
    setHorseName('')
    setLabelColor('')
    setMessage('')
    setError('')
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-400">Đang tải...</div>
      </div>
    )
  }

  const selectedSprite = sprites.find(s => s.key === spriteKey)
  const selectedSkill = skills.find(sk => sk.key === skillKey)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Ngựa của tôi</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Bạn có {horses.length} con ngựa. 
            {horses.length === 0 ? ' Tạo ngựa đầu tiên miễn phí!' : ` Tạo ngựa mới tốn ${CREATION_FEE} coins.`}
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 sm:px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition text-sm sm:text-base shrink-0"
          >
            + Tạo ngựa mới
          </button>
        )}
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-dark-900 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 border-2 border-primary-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {editingHorse ? `Sửa: ${editingHorse.horse_name}` : 'Tạo ngựa mới'}
            </h2>
            <button
              onClick={closeForm}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Horse Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tên ngựa
            </label>
            <input
              type="text"
              value={horseName}
              onChange={(e) => setHorseName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="Ví dụ: Lightning Strike"
              maxLength={30}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">{horseName.length}/30 ký tự</p>
          </div>

          {/* Sprite Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sprite (hình dáng ngựa) - {sprites.length} sprites có sẵn
            </label>
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto p-2 sm:p-4 bg-dark-800 rounded-lg">
              {sprites.map((sprite) => {
                const isSelected = spriteKey === sprite.key
                return (
                  <button
                    key={sprite.key}
                    onClick={() => setSpriteKey(sprite.key)}
                    disabled={saving}
                    className={`p-3 rounded-lg border-2 transition hover:scale-105 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/20 scale-105'
                        : 'border-dark-700 hover:border-primary-400'
                    }`}
                    title={sprite.name}
                  >
                    <img 
                      src={sprite.path} 
                      alt={sprite.name}
                      className="w-full h-20 object-contain"
                      loading="lazy"
                    />
                  </button>
                )
              })}
            </div>
            {selectedSprite && (
              <div className="mt-3 flex items-center gap-3 bg-dark-700 p-3 rounded-lg">
                <img 
                  src={selectedSprite.path}
                  alt={selectedSprite.name}
                  className="w-16 h-16 object-contain bg-dark-800 rounded border border-primary-500"
                />
                <div>
                  <p className="text-sm text-white font-medium">Đã chọn: {selectedSprite.name}</p>
                  <p className="text-xs text-gray-400">Hover vào sprite để xem rõ hơn</p>
                </div>
              </div>
            )}
          </div>

          {/* Skill Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Skill (kỹ năng đặc biệt)
            </label>
            <select
              value={skillKey}
              onChange={(e) => setSkillKey(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              {skills.map((skill) => (
                <option key={skill.key} value={skill.key}>
                  {skill.name} ({skill.nameEn})
                </option>
              ))}
            </select>
            {/* Skill Description */}
            {selectedSkill && selectedSkill.desc && (
              <div className="mt-2 px-3 py-2 bg-blue-500/10 border-l-4 border-blue-500 rounded-r text-sm text-blue-300">
                📖 {selectedSkill.desc}
              </div>
            )}
          </div>

          {/* Label Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Màu tên ngựa (Label Color)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={labelColor || '#FFFFFF'}
                onChange={(e) => setLabelColor(e.target.value)}
                disabled={saving}
                className="w-20 h-12 rounded-lg cursor-pointer border-2 border-dark-700 bg-dark-800"
              />
              <input
                type="text"
                value={labelColor || ''}
                onChange={(e) => setLabelColor(e.target.value)}
                placeholder="Để trống = màu ngẫu nhiên"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 font-mono text-sm"
                maxLength={7}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="w-24 h-10 rounded border border-dark-700 flex items-center justify-center font-bold"
                style={{ backgroundColor: labelColor || '#FFFFFF', color: '#1a1a1a' }}
              >
                {horseName || 'Preview'}
              </div>
              <p className="text-xs text-gray-500">
                {labelColor ? 'Màu tùy chỉnh' : 'Sẽ tự động chọn màu ngẫu nhiên'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={closeForm}
              disabled={saving}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition text-sm sm:text-base"
            >
              Hủy
            </button>
            <button
              onClick={editingHorse ? handleUpdateHorse : handleCreateHorse}
              disabled={saving}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition text-sm sm:text-base"
            >
              {saving ? 'Đang lưu...' : (editingHorse ? 'Cập nhật' : `Tạo${horses.length > 0 ? ` (-${CREATION_FEE} coins)` : ' (Miễn phí)'}`)}
            </button>
          </div>
        </div>
      )}

      {/* Active Horse Display */}
      {activeHorse && (
        <div className="bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl p-4 sm:p-6 border border-primary-500/30">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⭐</span> Ngựa đang sử dụng
          </h2>
          <div className="flex items-center gap-3 sm:gap-6">
            <img 
              src={`/assets/horses/${activeHorse.sprite_key}.png`}
              alt={activeHorse.horse_name}
              className="w-20 h-20 sm:w-32 sm:h-32 object-contain bg-dark-900/50 rounded-lg border-2 border-primary-500 shrink-0"
            />
            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-white truncate">{activeHorse.horse_name}</h3>
                  <p className="text-gray-400 text-sm">{skills.find(s => s.key === activeHorse.skill_key)?.name || activeHorse.skill_key}</p>
                </div>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-500 text-white text-xs sm:text-sm rounded-full self-start shrink-0">ACTIVE</span>
              </div>
              <div className="text-xs text-gray-500">
                Tạo: {new Date(activeHorse.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Horse List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Tất cả ngựa ({horses.length})</h2>
        
        {horses.length === 0 ? (
          <div className="bg-dark-900 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Bạn chưa có ngựa nào</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
            >
              Tạo ngựa đầu tiên (Miễn phí)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {horses.map((horse) => {
              const isActive = horse.is_active === 1
              return (
                <div
                  key={horse.id}
                  className={`bg-dark-900 rounded-lg p-4 border-2 transition ${
                    isActive ? 'border-primary-500' : 'border-dark-700'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <img 
                      src={`/assets/horses/${horse.sprite_key}.png`}
                      alt={horse.horse_name}
                      className="w-16 h-16 object-contain bg-dark-800 rounded border border-dark-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{horse.horse_name}</h3>
                      <p className="text-xs text-gray-400">{skills.find(s => s.key === horse.skill_key)?.name || horse.skill_key}</p>
                      {isActive && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded">ACTIVE</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSetActive(horse.id)}
                        className="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition"
                      >
                        Chọn dùng
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(horse)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                    >
                      Sửa
                    </button>
                    {horses.length > 1 && (
                      <button
                        onClick={() => handleDeleteHorse(horse)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                      >
                        Xóa
                      </button>
                    )}
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
