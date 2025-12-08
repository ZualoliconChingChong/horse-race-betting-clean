import { useState, useEffect } from 'react'
import api from '../services/api'
import useAuthStore from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { Facebook, ExternalLink, Edit, Save } from 'lucide-react'

export default function Admin() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [coinModal, setCoinModal] = useState(null)
  const [coinAmount, setCoinAmount] = useState('')
  const [coinReason, setCoinReason] = useState('')
  const [coinMode, setCoinMode] = useState('adjust') // 'adjust' or 'set'
  const [submitting, setSubmitting] = useState(false)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  
  // Edit user modal
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({
    username: '',
    facebookName: '',
    facebookUrl: ''
  })
  
  // Edit horse modal
  const [horseModal, setHorseModal] = useState(null)
  const [horseForm, setHorseForm] = useState({
    horseName: '',
    skillKey: '',
    spriteKey: '',
    labelColor: ''
  })
  
  // Horse options from API
  const [horseOptions, setHorseOptions] = useState({ sprites: [], skills: [] })

  useEffect(() => {
    if (!user || !(user.is_admin === 1 || user.username === 'admin')) {
      navigate('/')
      return
    }
    loadUsers()
    loadHorseOptions()
  }, [user, navigate])
  
  async function loadHorseOptions() {
    try {
      const res = await api.get('/horses/options')
      setHorseOptions({
        sprites: res.data.sprites || [],
        skills: res.data.skills || []
      })
    } catch (err) {
      console.error('Failed to load horse options:', err)
    }
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await api.get('/admin/users')
      setUsers(res.data.users || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdjustCoins() {
    if (!coinModal || !coinAmount) return
    
    const amount = parseInt(coinAmount, 10)
    
    if (coinMode === 'adjust') {
      // Adjust mode: add/subtract
      if (!Number.isFinite(amount) || amount === 0) {
        alert('Amount must be non-zero number')
        return
      }
    } else {
      // Set mode: set to exact value
      if (!Number.isFinite(amount) || amount < 0) {
        alert('Amount must be a positive number')
        return
      }
    }

    try {
      setSubmitting(true)
      await api.post(`/admin/users/${coinModal.id}/coins`, {
        amount,
        reason: coinReason || (coinMode === 'set' ? 'Admin set balance' : 'Admin adjustment'),
        mode: coinMode // 'adjust' or 'set'
      })
      
      setCoinModal(null)
      setCoinAmount('')
      setCoinReason('')
      setCoinMode('adjust')
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to adjust coins')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleBan(userId, currentBanned) {
    const action = currentBanned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      await api.post(`/admin/users/${userId}/ban`, {
        banned: !currentBanned
      })
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle ban')
    }
  }

  async function handleChangePassword() {
    if (!passwordModal || !newPassword) return

    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters')
      return
    }

    try {
      setSubmitting(true)
      await api.post(`/admin/users/${passwordModal.id}/password`, {
        newPassword
      })
      setPasswordModal(null)
      setNewPassword('')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteUser(userId, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return

    try {
      await api.delete(`/admin/users/${userId}`)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
    }
  }

  function openEditModal(u) {
    setEditForm({
      username: u.username || '',
      facebookName: u.facebook_name || '',
      facebookUrl: u.facebook_url || ''
    })
    setEditModal(u)
  }

  async function handleUpdateUser() {
    if (!editModal) return

    try {
      setSubmitting(true)
      await api.put(`/admin/users/${editModal.id}/info`, {
        username: editForm.username,
        facebookName: editForm.facebookName,
        facebookUrl: editForm.facebookUrl
      })
      setEditModal(null)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  function openHorseModal(horse) {
    setHorseForm({
      horseName: horse.horse_name || '',
      skillKey: horse.skill_key || '',
      spriteKey: horse.sprite_key || '',
      labelColor: horse.label_color || '#ffffff'
    })
    setHorseModal(horse)
  }

  async function handleUpdateHorse() {
    if (!horseModal) return

    try {
      setSubmitting(true)
      await api.put(`/admin/horses/${horseModal.id}`, {
        horseName: horseForm.horseName,
        skillKey: horseForm.skillKey,
        spriteKey: horseForm.spriteKey,
        labelColor: horseForm.labelColor
      })
      setHorseModal(null)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update horse')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || !(user.is_admin === 1 || user.username === 'admin')) {
    return null
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-400">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel v2</h1>
        <p className="text-gray-400">Manage users, coins, passwords and bans</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Change password modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Change Password: {passwordModal.username}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter new password"
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={submitting || !newPassword}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setPasswordModal(null)
                  setNewPassword('')
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit size={20} />
              Chỉnh sửa: {editModal.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Username"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Facebook size={14} className="inline mr-1 text-blue-400" />
                  Tên Facebook
                </label>
                <input
                  type="text"
                  value={editForm.facebookName}
                  onChange={(e) => setEditForm({...editForm, facebookName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Nguyễn Văn A"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🔗 URL Facebook
                </label>
                <input
                  type="url"
                  value={editForm.facebookUrl}
                  onChange={(e) => setEditForm({...editForm, facebookUrl: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://facebook.com/..."
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateUser}
                disabled={submitting || !editForm.username}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={() => setEditModal(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Horse Modal */}
      {horseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🐴 Chỉnh sửa ngựa
            </h3>

            {/* Horse Preview */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-700 rounded-lg">
              <img 
                src={horseForm.spriteKey ? `/assets/horses/${horseForm.spriteKey}.png` : '/assets/horses/default.png'}
                alt="Preview"
                className="w-16 h-16 object-contain bg-gray-600 rounded border-2"
                style={{ borderColor: horseForm.labelColor || '#4b5563' }}
              />
              <div>
                <p className="text-white font-bold">{horseForm.horseName || 'Tên ngựa'}</p>
                <p className="text-gray-400 text-sm">
                  {horseOptions.skills.find(s => s.key === horseForm.skillKey)?.name || horseForm.skillKey || 'Chọn skill'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tên ngựa
                </label>
                <input
                  type="text"
                  value={horseForm.horseName}
                  onChange={(e) => setHorseForm({...horseForm, horseName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Tên ngựa"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Skill
                </label>
                <select
                  value={horseForm.skillKey}
                  onChange={(e) => setHorseForm({...horseForm, skillKey: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  disabled={submitting}
                >
                  <option value="">-- Chọn skill --</option>
                  {horseOptions.skills.map(skill => (
                    <option key={skill.key} value={skill.key}>
                      {skill.name} ({skill.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sprite
                </label>
                <select
                  value={horseForm.spriteKey}
                  onChange={(e) => setHorseForm({...horseForm, spriteKey: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  disabled={submitting}
                >
                  <option value="">-- Chọn sprite --</option>
                  {horseOptions.sprites.map(sprite => (
                    <option key={sprite.key} value={sprite.key}>
                      {sprite.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Màu label
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={horseForm.labelColor || '#ffffff'}
                    onChange={(e) => setHorseForm({...horseForm, labelColor: e.target.value})}
                    className="w-12 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                    disabled={submitting}
                  />
                  <input
                    type="text"
                    value={horseForm.labelColor}
                    onChange={(e) => setHorseForm({...horseForm, labelColor: e.target.value})}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    placeholder="#ffffff"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateHorse}
                disabled={submitting || !horseForm.horseName}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={() => setHorseModal(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Facebook</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Horse</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Coins</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wins</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Races</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm text-gray-300">{u.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{u.username}</span>
                      {u.is_admin === 1 && (
                        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.facebook_name || u.facebook_url ? (
                      <div className="space-y-1">
                        {u.facebook_name && (
                          <div className="flex items-center gap-1">
                            <Facebook size={14} className="text-blue-400" />
                            <span className="text-white text-xs">{u.facebook_name}</span>
                          </div>
                        )}
                        {u.facebook_url && (
                          <a
                            href={u.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition"
                            title="Mở Facebook"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate max-w-[120px]">
                              {u.facebook_url.replace('https://facebook.com/', '').replace('https://www.facebook.com/', '')}
                            </span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Chưa có</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.horseCount > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 mb-1">
                          {u.horseCount} ngựa
                        </div>
                        {u.horses.map((horse, idx) => (
                          <div key={horse.id} className="flex items-center gap-2 py-1 group">
                            <img 
                              src={`/assets/horses/${horse.sprite_key}.png`}
                              alt={horse.horse_name}
                              className="w-10 h-10 object-contain bg-gray-700 rounded border-2"
                              style={{ borderColor: horse.label_color || '#4b5563' }}
                              title={`${horse.horse_name} (${horse.skill_key})`}
                            />
                            <div className="text-xs flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-white font-medium truncate">{horse.horse_name}</span>
                                {horse.is_active === 1 && (
                                  <span className="px-1.5 py-0.5 bg-primary-500 text-white text-[10px] rounded">ACTIVE</span>
                                )}
                              </div>
                              <div className="text-gray-400 truncate">{horse.skill_key}</div>
                            </div>
                            <button
                              onClick={() => openHorseModal(horse)}
                              className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] rounded transition"
                              title="Sửa ngựa"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No horses</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-yellow-400 font-semibold">{u.coins.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{u.total_wins}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{u.total_races}</td>
                  <td className="px-4 py-3 text-sm">
                    {u.banned === 1 ? (
                      <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition flex items-center gap-1"
                      >
                        <Edit size={12} />
                        Edit Info
                      </button>
                      <button
                        onClick={() => setCoinModal(u)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                      >
                        Adjust Coins
                      </button>
                      <button
                        onClick={() => setPasswordModal(u)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => handleToggleBan(u.id, u.banned === 1)}
                        className={`px-3 py-1 text-white text-xs rounded transition ${
                          u.banned === 1
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {u.banned === 1 ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-red-300 text-xs rounded border border-red-500/40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coin adjustment modal */}
      {coinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              💰 Điều chỉnh tiền: {coinModal.username}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Số dư hiện tại: <span className="text-yellow-400 font-semibold">{coinModal.coins?.toLocaleString()}</span> coins
              </p>
            </div>
            
            {/* Mode toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Chế độ</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCoinMode('adjust'); setCoinAmount(''); }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                    coinMode === 'adjust' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={submitting}
                >
                  ➕➖ Cộng/Trừ
                </button>
                <button
                  onClick={() => { setCoinMode('set'); setCoinAmount(''); }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                    coinMode === 'set' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={submitting}
                >
                  🎯 Đặt số cụ thể
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {coinMode === 'adjust' 
                  ? 'Số tiền (dương = cộng, âm = trừ)' 
                  : 'Số tiền mới'}
              </label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder={coinMode === 'adjust' ? 'VD: 1000 hoặc -500' : 'VD: 10000'}
                disabled={submitting}
                min={coinMode === 'set' ? 0 : undefined}
              />
              {coinMode === 'set' && coinAmount && (
                <p className="text-xs text-gray-400 mt-1">
                  Thay đổi: <span className={parseInt(coinAmount) - coinModal.coins >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {parseInt(coinAmount) - coinModal.coins >= 0 ? '+' : ''}{(parseInt(coinAmount) - coinModal.coins).toLocaleString()}
                  </span> coins
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lý do (tùy chọn)
              </label>
              <input
                type="text"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="VD: Thưởng sự kiện, Hoàn tiền..."
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAdjustCoins}
                disabled={submitting || !coinAmount}
                className={`flex-1 px-4 py-2 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition ${
                  coinMode === 'set' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Đang xử lý...' : (coinMode === 'set' ? 'Đặt số dư' : 'Áp dụng')}
              </button>
              <button
                onClick={() => {
                  setCoinModal(null)
                  setCoinAmount('')
                  setCoinReason('')
                  setCoinMode('adjust')
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
