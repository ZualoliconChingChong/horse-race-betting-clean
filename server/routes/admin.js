const express = require('express')
const bcrypt = require('bcryptjs')
const { userOps, transactionOps, userHorseOps } = require('../db/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

function ensureAdmin(req, res) {
  const current = userOps.findById.get(req.user.id)
  const isAdminUser = current && (current.is_admin === 1 || current.username === 'admin')

  if (!isAdminUser) {
    res.status(403).json({ error: 'Admin only' })
    return null
  }
  return current
}

router.use(authenticateToken)

router.get('/users', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const users = userOps.getAll.all()
  
  // Attach all horses info to each user
  const usersWithHorses = users.map(user => {
    const horses = userHorseOps.findByUserId.all(user.id)
    const activeHorse = horses.find(h => h.is_active === 1) || null
    return {
      ...user,
      horses: horses,
      activeHorse: activeHorse,
      horseCount: horses.length
    }
  })
  
  res.json({ users: usersWithHorses })
})

router.post('/users/:id/coins', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const targetId = parseInt(req.params.id, 10)
  const { amount, reason, mode } = req.body || {}

  if (!Number.isFinite(amount)) {
    return res.status(400).json({ error: 'Amount must be a valid number' })
  }

  const user = userOps.findById.get(targetId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  let newBalance
  let transactionType
  let transactionAmount
  
  if (mode === 'set') {
    // Set mode: set to exact value
    if (amount < 0) {
      return res.status(400).json({ error: 'Balance cannot be negative' })
    }
    newBalance = amount
    transactionAmount = amount - user.coins // The difference
    transactionType = 'admin_set'
  } else {
    // Adjust mode (default): add/subtract
    if (amount === 0) {
      return res.status(400).json({ error: 'Amount must be non-zero' })
    }
    newBalance = user.coins + amount
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Resulting balance cannot be negative' })
    }
    transactionAmount = amount
    transactionType = 'admin_adjust'
  }

  userOps.updateCoins.run(newBalance, targetId)

  transactionOps.create.run(
    targetId,
    transactionType,
    transactionAmount,
    newBalance,
    reason || (mode === 'set' ? 'Admin set balance' : 'Admin coin adjustment'),
    null
  )

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      coins: newBalance,
      total_wins: user.total_wins,
      total_races: user.total_races,
      is_admin: user.is_admin || 0,
      banned: user.banned || 0
    }
  })
})

router.post('/users/:id/ban', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const targetId = parseInt(req.params.id, 10)
  const { banned } = req.body || {}

  const user = userOps.findById.get(targetId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const flag = banned ? 1 : 0
  userOps.updateBanned.run(flag, targetId)

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      coins: user.coins,
      total_wins: user.total_wins,
      total_races: user.total_races,
      is_admin: user.is_admin || 0,
      banned: flag
    }
  })
})

// Change user password
router.post('/users/:id/password', async (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const targetId = parseInt(req.params.id, 10)
  const { newPassword } = req.body || {}

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' })
  }

  const user = userOps.findById.get(targetId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    const { db } = require('../db/database')
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, targetId])

    res.json({ success: true })
  } catch (err) {
    console.error('Admin change password error:', err)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// Update user info (username, facebook)
router.put('/users/:id/info', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const targetId = parseInt(req.params.id, 10)
  const { username, facebookName, facebookUrl } = req.body || {}

  const user = userOps.findById.get(targetId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Validate username
  if (!username || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username phải từ 3-20 ký tự' })
  }

  // Check if new username is taken by another user
  if (username !== user.username) {
    const existing = userOps.findByUsername.get(username)
    if (existing && existing.id !== targetId) {
      return res.status(400).json({ error: 'Username đã được sử dụng' })
    }
  }

  // Validate Facebook URL if provided
  if (facebookUrl && !facebookUrl.includes('facebook.com')) {
    return res.status(400).json({ error: 'URL Facebook không hợp lệ' })
  }

  try {
    const { db, saveDatabase } = require('../db/database')
    
    db.run(
      'UPDATE users SET username = ?, facebook_name = ?, facebook_url = ? WHERE id = ?',
      [username, facebookName || null, facebookUrl || null, targetId]
    )
    
    saveDatabase()

    res.json({ 
      success: true,
      message: 'Cập nhật thông tin thành công'
    })
  } catch (err) {
    console.error('Admin update user info error:', err)
    res.status(500).json({ error: 'Failed to update user info' })
  }
})

// Update horse info
router.put('/horses/:id', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const horseId = parseInt(req.params.id, 10)
  const { horseName, skillKey, spriteKey, labelColor } = req.body || {}

  if (!horseName || horseName.length < 1) {
    return res.status(400).json({ error: 'Tên ngựa không được để trống' })
  }

  try {
    const { db, saveDatabase } = require('../db/database')
    
    // Check if horse exists
    const horseResult = db.exec('SELECT * FROM user_horses WHERE id = ?', [horseId])
    if (!horseResult[0] || horseResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Horse not found' })
    }

    db.run(
      'UPDATE user_horses SET horse_name = ?, skill_key = ?, sprite_key = ?, label_color = ? WHERE id = ?',
      [horseName, skillKey || 'none', spriteKey || 'horse_brown', labelColor || '#ffffff', horseId]
    )
    
    saveDatabase()

    res.json({ 
      success: true,
      message: 'Cập nhật ngựa thành công'
    })
  } catch (err) {
    console.error('Admin update horse error:', err)
    res.status(500).json({ error: 'Failed to update horse' })
  }
})

// Delete user
router.delete('/users/:id', (req, res) => {
  const admin = ensureAdmin(req, res)
  if (!admin) return

  const targetId = parseInt(req.params.id, 10)

  const user = userOps.findById.get(targetId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Prevent deleting self admin account for safety
  if (targetId === admin.id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' })
  }

  try {
    userOps.delete.run(targetId)
    res.json({ success: true })
  } catch (err) {
    console.error('Admin delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

module.exports = router
