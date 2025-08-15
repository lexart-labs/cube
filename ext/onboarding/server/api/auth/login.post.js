import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const { email, password, recaptchaToken } = await readBody(event)
  const config = useRuntimeConfig()

  // Verify reCAPTCHA
  try {
    const recaptchaResponse = await $fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: config.recaptchaSecretKey,
        response: recaptchaToken
      })
    })

    if (!recaptchaResponse.success || recaptchaResponse.score < 0.5) {
      throw createError({
        statusCode: 400,
        statusMessage: 'reCAPTCHA verification failed'
      })
    }
  } catch (recaptchaError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'reCAPTCHA verification failed'
    })
  }

  try {
    const users = await executeQuery(
      'SELECT * FROM pending_users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    const user = users[0]
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Check if user has completed KYC
    const kycData = await executeQuery(
      'SELECT * FROM pending_users_kyc_data WHERE user_id = ?',
      [user.id]
    )

    // Check if user has completed contracts
    const contractsData = await executeQuery(
      'SELECT * FROM pending_users_contracts WHERE user_id = ? AND contracts_completed = TRUE',
      [user.id]
    )

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        kyc_status: user.kyc_status,
        has_kyc_data: kycData.length > 0,
        has_contracts_data: contractsData.length > 0
      }
    }
  } catch (error) {
    console.error('Database error in login:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${error.message}`
    })
  }
})