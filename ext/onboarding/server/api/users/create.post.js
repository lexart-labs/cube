import bcrypt from 'bcryptjs'
import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'
import { sendEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)

  const config = useRuntimeConfig()

  try {
    const { name, email, password, sendEmail: shouldSendEmail = true } = await readBody(event)

    // Validate required fields
    if (!name || !email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, email, and password are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM pending_users WHERE email = ?',
      [email]
    )

    if (existingUser.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User with this email already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO pending_users (email, name, password, kyc_status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [email, name, hashedPassword, 'pending']
    )

    const userId = result.insertId

    // Send email with login credentials if requested
    if (shouldSendEmail) {
      try {
        const emailHtml = generateWelcomeEmailTemplate({
          name,
          email,
          password, // Send plain password in email
          onboardingUrl: config.public.onboardingUrl || 'http://localhost:3000'
        })

        await sendEmail(config, {
          to: email,
          subject: 'Welcome to Lexart Onboarding - Your Login Credentials',
          html: emailHtml
        })

        console.log(`Welcome email sent to ${email}`)
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the user creation if email fails
      }
    }

    return {
      success: true,
      message: 'User created successfully',
      userId,
      emailSent: shouldSendEmail
    }
  } catch (error) {
    console.error('Error creating user:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

function generateWelcomeEmailTemplate({ name, email, password, onboardingUrl }) {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .credentials-box { background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
          .btn:hover { background-color: #0056b3; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Lexart Onboarding!</h1>

          <p>Hello ${name},</p>

          <p>Your account has been created for the Lexart onboarding process. Please use the credentials below to access the onboarding portal:</p>

          <div class="credentials-box">
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Onboarding Portal:</strong> <a href="${onboardingUrl}">Access Onboarding Portal</a></p>
          </div>

          <p>To get started:</p>
          <ol>
            <li>Click the link above or visit the onboarding portal</li>
            <li>Log in with your credentials</li>
            <li>Complete the KYC process</li>
            <li>Review and sign the required documents</li>
          </ol>

          <div class="footer">
            <p>This is an automated message from Lexart Onboarding System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
