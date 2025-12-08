// Thêm vào phần state declarations (sau line ~24):
const [editNameModal, setEditNameModal] = useState(false)
const [newRaceName, setNewRaceName] = useState('')
const [updatingName, setUpdatingName] = useState(false)

// Thêm function này (sau loadRaceData):
async function handleUpdateRaceName() {
  if (updatingName) return
  
  try {
    setUpdatingName(true)
    setError('')
    
    await api.put(`/race/${id}/name`, { name: newRaceName || null })
    
    setMessage('Đã cập nhật tên lobby!')
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

// Modal HTML (thêm TRƯỚC modal joinModal):
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

// Button "Đổi Tên" - thêm NGAY SAU nút "✏️ Editor" (trong phần header):
{(user?.is_admin === 1 || user?.username === 'admin') && currentRace?.status === 'registration' && (
  <button
    onClick={() => {
      setNewRaceName(currentRace?.name || '')
      setEditNameModal(true)
    }}
    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
  >
    ✏️ Đổi Tên
  </button>
)}
