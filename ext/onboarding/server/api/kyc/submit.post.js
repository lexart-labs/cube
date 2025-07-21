import jwt from 'jsonwebtoken'
import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No token provided'
    })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    const kycData = await readBody(event)

    // Insert/Update KYC data
    await executeQuery(
      `INSERT INTO pending_users_kyc_data 
       (user_id, full_name, identity_document, full_address, bank_information, 
        country, iban, intermediary_bank, profile_photo, phone, emergency_phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       identity_document = VALUES(identity_document),
       full_address = VALUES(full_address),
       bank_information = VALUES(bank_information),
       country = VALUES(country),
       iban = VALUES(iban),
       intermediary_bank = VALUES(intermediary_bank),
       profile_photo = VALUES(profile_photo),
       phone = VALUES(phone),
       emergency_phone = VALUES(emergency_phone)`,
      [
        decoded.userId,
        kycData.fullName,
        kycData.identityDocument,
        kycData.fullAddress,
        kycData.bankInformation,
        kycData.country,
        kycData.iban,
        kycData.intermediaryBank,
        kycData.profilePhoto,
        kycData.phone,
        kycData.emergencyPhone
      ]
    )

    // Update user status to under_review
    await executeQuery(
      'UPDATE pending_users SET kyc_status = "under_review" WHERE id = ?',
      [decoded.userId]
    )

    return { success: true, message: 'KYC data saved successfully' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save KYC data'
    })
  }
})