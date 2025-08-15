import bcrypt from 'bcryptjs'
import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const { email, name, password } = await readBody(event)

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    
    await executeQuery(
      'INSERT INTO pending_users (email, name, password) VALUES (?, ?, ?)',
      [email, name, hashedPassword]
    )

    return { success: true, message: 'User registered successfully' }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already exists'
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed'
    })
  }
})