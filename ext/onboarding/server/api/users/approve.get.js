import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)
  
  try {
    const query = getQuery(event)
    const userId = query.userId

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Update user status to approved
    await executeQuery(`
      UPDATE pending_users 
      SET kyc_status = 'approved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId])

    return {
      success: true,
      message: 'User approved successfully'
    }
  } catch (error) {
    console.error('Error approving user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error approving user: ${error.message}`
    })
  }
})