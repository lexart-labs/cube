import jwt from 'jsonwebtoken'
import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    const { ndaContract, serviceAgreementContract } = await readBody(event)

    // Insert or update contracts data and mark as completed
    await executeQuery(`
      INSERT INTO pending_users_contracts (user_id, nda_contract, service_agreement_contract, contracts_completed)
      VALUES (?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        nda_contract = VALUES(nda_contract),
        service_agreement_contract = VALUES(service_agreement_contract),
        contracts_completed = TRUE,
        updated_at = CURRENT_TIMESTAMP
    `, [decoded.userId, ndaContract, serviceAgreementContract])

    // Update user status to under_review after contracts completion
    await executeQuery(`
      UPDATE pending_users
      SET kyc_status = 'under_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [decoded.userId])

    // Try to send email notification (optional - don't fail if email fails)
    try {
      // Check if email configuration is available and valid
      if (config.mailgunApiKey && config.mailgunDomain &&
          config.mailgunApiKey !== 'your-mailgun-api-key' &&
          config.mailgunDomain !== 'your-mailgun-domain') {

        const { sendEmail, generateOnboardingEmailTemplate, getContractAttachments } = await import('~/server/utils/email')

        // Get user data and KYC data for email
        const userData = await executeQuery(
          'SELECT * FROM pending_users WHERE id = ?',
          [decoded.userId]
        )

        const kycData = await executeQuery(
          'SELECT * FROM pending_users_kyc_data WHERE user_id = ?',
          [decoded.userId]
        )

        if (userData.length > 0 && kycData.length > 0) {
          // Get contract attachments
          const attachments = getContractAttachments(ndaContract, serviceAgreementContract)

          // Send email notification with attachments
          const emailHtml = generateOnboardingEmailTemplate(
            userData[0],
            kycData[0],
            config.appUrl || 'http://localhost:3000',
            decoded.userId
          )

          // Get recipient email from environment variable or use a default
          const recipientEmail = process.env.EMAIL_ONBOARDING

          await sendEmail(config, {
            to: recipientEmail,
            subject: `New onboarding request - ${kycData[0].full_name}`,
            html: emailHtml,
            attachments: attachments
          })

          console.log('Email notification sent successfully with contract attachments')
        }
      } else {
        console.log('Email configuration not available - skipping email notification')
      }
    } catch (emailError) {
      console.error('Failed to send email notification (continuing with success):', emailError)
      // Don't throw the error - email failure shouldn't break contract submission
    }

    return { success: true, message: 'Contracts submitted successfully' }
  } catch (error) {
    console.error('Database error in contracts submit:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${error.message}`
    })
  }
})
