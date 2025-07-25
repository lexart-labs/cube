import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)

  // Declare variables outside try block so they're accessible in catch
  let query
  let offset

  try {
    // Get query parameters for pagination and filtering
    query = getQuery(event)

    // Ensure page is a valid number, default to 0 if NaN or invalid
    const pageParam = query.page
    const page = (pageParam === undefined || pageParam === null || pageParam === '' || isNaN(Number(pageParam)))
      ? 0
      : Math.max(0, parseInt(pageParam))

    const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10))
    offset = page * limit

    console.log('Query parameters:', {
      originalPage: query.page,
      parsedPage: page,
      limit,
      offset
    })

    // Enhanced query using subqueries to avoid duplicates
    const usersQuery = `
      SELECT
        pu.id,
        pu.email,
        pu.name,
        pu.kyc_status,
        pu.created_at,
        pu.updated_at,
        kyc.lexart_signed_nda,
        kyc.lexart_signed_service_agreement,
        kyc.full_name,
        kyc.identity_document,
        kyc.full_address,
        kyc.bank_information,
        kyc.country,
        kyc.iban,
        kyc.intermediary_bank,
        kyc.profile_photo,
        kyc.phone,
        kyc.emergency_phone,
        kyc.company_name,
        kyc.company_rut,
        kyc.company_address,
        puc.nda_contract,
        puc.service_agreement_contract
      FROM pending_users pu
      LEFT JOIN (
        SELECT DISTINCT user_id,
               FIRST_VALUE(lexart_signed_nda) OVER (PARTITION BY user_id ORDER BY id) as lexart_signed_nda,
               FIRST_VALUE(lexart_signed_service_agreement) OVER (PARTITION BY user_id ORDER BY id) as lexart_signed_service_agreement,
               FIRST_VALUE(full_name) OVER (PARTITION BY user_id ORDER BY id) as full_name,
               FIRST_VALUE(identity_document) OVER (PARTITION BY user_id ORDER BY id) as identity_document,
               FIRST_VALUE(full_address) OVER (PARTITION BY user_id ORDER BY id) as full_address,
               FIRST_VALUE(bank_information) OVER (PARTITION BY user_id ORDER BY id) as bank_information,
               FIRST_VALUE(country) OVER (PARTITION BY user_id ORDER BY id) as country,
               FIRST_VALUE(iban) OVER (PARTITION BY user_id ORDER BY id) as iban,
               FIRST_VALUE(intermediary_bank) OVER (PARTITION BY user_id ORDER BY id) as intermediary_bank,
               FIRST_VALUE(profile_photo) OVER (PARTITION BY user_id ORDER BY id) as profile_photo,
               FIRST_VALUE(phone) OVER (PARTITION BY user_id ORDER BY id) as phone,
               FIRST_VALUE(emergency_phone) OVER (PARTITION BY user_id ORDER BY id) as emergency_phone,
               FIRST_VALUE(company_name) OVER (PARTITION BY user_id ORDER BY id) as company_name,
               FIRST_VALUE(company_rut) OVER (PARTITION BY user_id ORDER BY id) as company_rut,
               FIRST_VALUE(company_address) OVER (PARTITION BY user_id ORDER BY id) as company_address
        FROM pending_users_kyc_data
      ) kyc ON pu.id = kyc.user_id
      LEFT JOIN (
        SELECT DISTINCT user_id,
               FIRST_VALUE(nda_contract) OVER (PARTITION BY user_id ORDER BY id) as nda_contract,
               FIRST_VALUE(service_agreement_contract) OVER (PARTITION BY user_id ORDER BY id) as service_agreement_contract
        FROM pending_users_contracts
      ) puc ON pu.id = puc.user_id
      ORDER BY pu.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Query to get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pending_users
    `

    console.log('Executing queries with KYC data join:', {
      limit,
      offset
    })

    // Execute queries without parameters
    const [users, countResult] = await Promise.all([
      executeQuery(usersQuery),
      executeQuery(countQuery)
    ])

    const total = countResult[0]?.total || 0
    const totalPages = Math.ceil(total / limit)

    // Transform users data to include userKyc object and adjunct URL
    const transformedUsers = users.map(user => {
      const userKyc = {
        full_name: user.full_name,
        identity_document: user.identity_document,
        full_address: user.full_address,
        bank_information: user.bank_information,
        country: user.country,
        iban: user.iban,
        intermediary_bank: user.intermediary_bank,
        profile_photo: user.profile_photo,
        phone: user.phone,
        emergency_phone: user.emergency_phone,
        company_name: user.company_name,
        company_rut: user.company_rut,
        company_address: user.company_address
      }

      // Generate adjunct URL for user details/management
      const adjunctSignedFiles = {
        nda: user.nda_contract,
        service_agreement: user.service_agreement_contract
      }

      // Add the signed documents from Lexart
      const lexartSignedDocuments = {
        nda: user.lexart_signed_nda,
        service_agreement: user.lexart_signed_service_agreement
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        kyc_status: user.kyc_status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        userKyc,
        adjunctSignedFiles,
        lexartSignedDocuments
      }
    })

    console.log('Query successful, users found:', transformedUsers.length)

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      meta: {
        queryType: 'enhanced_with_kyc',
        note: 'Including KYC data and adjunct URLs for each user'
      }
    }
  } catch (error) {
    console.error('Error fetching pending users:', error)
    console.error('Query details:', {
      page: query?.page,
      limit: query?.limit,
      calculatedOffset: offset
    })

    // Try an even simpler query without parameters
    try {
      console.log('Attempting parameter-less query...')
      const fallbackQuery = `SELECT COUNT(*) as total FROM pending_users`
      const fallbackResult = await executeQuery(fallbackQuery)
      console.log('Fallback query result:', fallbackResult)

      return {
        users: [],
        pagination: {
          page: 0,
          limit: 10,
          total: fallbackResult[0]?.total || 0,
          totalPages: 0
        },
        error: 'Parameter binding issue detected',
        fallbackData: fallbackResult[0]
      }
    } catch (fallbackError) {
      console.error('Even fallback query failed:', fallbackError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database connection issue: ${fallbackError.message}`
      })
    }
  }
})
