import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)
  
  try {
    const userId = getRouterParam(event, 'id')
    const { status } = await readBody(event)

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid status is required (pending, approved, rejected)'
      })
    }

    // Update user status
    await executeQuery(`
      UPDATE pending_users 
      SET kyc_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, userId])

    return {
      success: true,
      message: `User status updated to ${status} successfully`
    }
  } catch (error) {
    console.error('Error updating user status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating user status: ${error.message}`
    })
  }
})