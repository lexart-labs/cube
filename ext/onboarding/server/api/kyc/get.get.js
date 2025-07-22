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

    // Fetch existing KYC data for the user
    const kycData = await executeQuery(
      'SELECT * FROM pending_users_kyc_data WHERE user_id = ?',
      [decoded.userId]
    )

    if (kycData.length === 0) {
      return { data: null }
    }

    // Return the KYC data (excluding sensitive fields if needed)
    const data = kycData[0]
    return {
      data: {
        fullName: data.full_name,
        identityDocument: data.identity_document,
        fullAddress: data.full_address,
        bankInformation: data.bank_information,
        country: data.country,
        iban: data.iban,
        intermediaryBank: data.intermediary_bank,
        profilePhoto: data.profile_photo,
        phone: data.phone,
        emergencyPhone: data.emergency_phone,
        companyName: data.company_name,
        companyRut: data.company_rut,
        companyAddress: data.company_address
      }
    }
  } catch (error) {
    console.error('Database error in KYC get:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${error.message}`
    })
  }
})
