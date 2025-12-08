// Script to make a user admin
// Usage: node make-admin.js <username>

const { initDatabase, userOps, saveDatabase } = require('./db/database')

async function makeAdmin() {
  const username = process.argv[2]
  
  if (!username) {
    console.log('Usage: node make-admin.js <username>')
    console.log('Example: node make-admin.js admin')
    process.exit(1)
  }

  await initDatabase()

  const user = userOps.findByUsername.get(username)
  if (!user) {
    console.error(`❌ User "${username}" not found`)
    process.exit(1)
  }

  if (user.is_admin === 1) {
    console.log(`✅ User "${username}" is already admin`)
    process.exit(0)
  }

  // Set is_admin = 1
  const { db } = require('./db/database')
  db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [user.id])
  
  // Must save after updating
  saveDatabase()
  
  // Wait a bit for save to complete
  setTimeout(() => {
    console.log(`✅ User "${username}" is now admin!`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Coins: ${user.coins}`)
    console.log('')
    console.log('You can now login and access /admin page')
    process.exit(0)
  }, 500)
}

makeAdmin().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
