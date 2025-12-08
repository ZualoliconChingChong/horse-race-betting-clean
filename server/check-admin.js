// Check admin status
const { initDatabase, userOps } = require('./db/database')

async function checkAdmin() {
  await initDatabase()
  
  const user = userOps.findByUsername.get('admin')
  if (!user) {
    console.log('❌ User "admin" not found')
    process.exit(1)
  }

  console.log('User info:')
  console.log('  ID:', user.id)
  console.log('  Username:', user.username)
  console.log('  Coins:', user.coins)
  console.log('  is_admin:', user.is_admin)
  console.log('  banned:', user.banned)
  
  if (user.is_admin === 1) {
    console.log('\n✅ User is ADMIN')
  } else {
    console.log('\n❌ User is NOT admin')
  }
  
  process.exit(0)
}

checkAdmin().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
