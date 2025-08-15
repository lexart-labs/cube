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

    // Check if KYC data already exists for this user
    const existingData = await executeQuery(
      'SELECT id FROM pending_users_kyc_data WHERE user_id = ?',
      [decoded.userId]
    )

    if (existingData.length > 0) {
      // Update existing KYC data
      await executeQuery(
        `UPDATE pending_users_kyc_data SET 
         full_name = ?, identity_document = ?, full_address = ?, bank_information = ?, 
         country = ?, iban = ?, intermediary_bank = ?, profile_photo = ?, phone = ?, emergency_phone = ?,
         company_name = ?, company_rut = ?, company_address = ?
         WHERE user_id = ?`,
        [
          kycData.fullName,
          kycData.identityDocument,
          kycData.fullAddress,
          kycData.bankInformation,
          kycData.country,
          kycData.iban,
          kycData.intermediaryBank,
          kycData.profilePhoto,
          kycData.phone,
          kycData.emergencyPhone,
          kycData.company_name,
          kycData.company_rut,
          kycData.company_address,
          decoded.userId
        ]
      )
    } else {
      // Insert new KYC data
      await executeQuery(
        `INSERT INTO pending_users_kyc_data 
         (user_id, full_name, identity_document, full_address, bank_information, 
          country, iban, intermediary_bank, profile_photo, phone, emergency_phone,
          company_name, company_rut, company_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          kycData.emergencyPhone,
          kycData.company_name,
          kycData.company_rut,
          kycData.company_address
        ]
      )
    }

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