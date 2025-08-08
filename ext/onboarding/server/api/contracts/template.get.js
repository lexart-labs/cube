import jwt from 'jsonwebtoken'
import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No token provided'
    })
  }

  if (!query.type || !['nda', 'service_agreement'].includes(query.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid contract type'
    })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    const userId = decoded.userId // Changed from decoded.id to decoded.userId
    
    // Get contract template
    const templateResult = await executeQuery(
      'SELECT title, content FROM contract_templates WHERE contract_type = ? AND is_active = TRUE',
      [query.type]
    )

    if (templateResult.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contract template not found'
      })
    }

    // Get user data
    const userData = await executeQuery(
      'SELECT u.name, u.email, k.* FROM pending_users u ' +
      'LEFT JOIN pending_users_kyc_data k ON u.id = k.user_id ' +
      'WHERE u.id = ?',
      [userId]
    )

    if (userData.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User data not found'
      })
    }

    // Get today's date components
    const today = new Date()
    const day = today.getDate()
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const month = monthNames[today.getMonth()]
    const year = today.getFullYear()

    // Replace variables in the template
    let content = templateResult[0].content
    
    // Date variables
    content = content.replace(/{{today_day}}/g, day)
    content = content.replace(/{{today_month}}/g, month)
    content = content.replace(/{{today_year}}/g, year)
    
    // User variables
    content = content.replace(/{{user_full_name}}/g, userData[0].full_name || userData[0].name || '')
    content = content.replace(/{{user_legal_identification}}/g, userData[0].identity_document || '')
    
    // Company variables
    content = content.replace(/{{company_name}}/g, userData[0].company_name || '')
    content = content.replace(/{{company_rut}}/g, userData[0].company_rut || '')
    content = content.replace(/{{company_address}}/g, userData[0].company_address || '')

    return {
      success: true,
      data: {
        title: templateResult[0].title,
        content: content
      }
    }
  } catch (error) {
    console.error('Template error:', error)
    if (error.name === 'JsonWebTokenError') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contract template'
    })
  }
})