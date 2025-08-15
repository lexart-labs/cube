const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function resetTestUser() {
  let connection
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'app_user',
      password: process.env.DB_PASSWORD || 'app_password',
      database: process.env.DB_NAME || 'onboarding_db'
    })

    console.log('Connected to database successfully')

    // Hash the password with the same settings as your app
    const plainPassword = 'password'
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    
    console.log('Generated hash:', hashedPassword)
    console.log('Verifying hash:', await bcrypt.compare(plainPassword, hashedPassword))

    // Delete existing user and insert fresh one
    await connection.execute('DELETE FROM pending_users WHERE email = ?', ['test@test.com'])
    
    const [result] = await connection.execute(
      'INSERT INTO pending_users (email, name, password) VALUES (?, ?, ?)',
      ['test@test.com', 'Test User', hashedPassword]
    )

    console.log('✅ Test user reset successfully:')
    console.log('- Email: test@test.com')
    console.log('- Password: password')
    console.log('- User ID:', result.insertId)

  } catch (error) {
    console.error('Error resetting user:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

resetTestUser()