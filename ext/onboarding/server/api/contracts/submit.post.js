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
    const contractData = await readBody(event)

    await executeQuery(
      `INSERT INTO pending_users_contracts 
       (user_id, nda_contract, service_agreement_contract, contracts_completed) 
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
       nda_contract = VALUES(nda_contract),
       service_agreement_contract = VALUES(service_agreement_contract),
       contracts_completed = TRUE`,
      [
        decoded.userId,
        contractData.nda_contract,
        contractData.service_agreement_contract
      ]
    )

    return { success: true, message: 'Contracts saved successfully' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save contracts'
    })
  }
})