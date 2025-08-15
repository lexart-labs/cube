import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)

  try {
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Check if user exists
    const userCheck = await executeQuery(
      'SELECT id, email FROM pending_users WHERE id = ?',
      [userId]
    )

    if (userCheck.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Delete related KYC data first (if exists)
    await executeQuery(
      'DELETE FROM pending_users_kyc_data WHERE user_id = ?',
      [userId]
    )

    // Delete the user
    const deleteResult = await executeQuery(
      'DELETE FROM pending_users WHERE id = ?',
      [userId]
    )

    if (deleteResult.affectedRows === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found or already deleted'
      })
    }

    return {
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId
    }

  } catch (error) {
    console.error('Error deleting user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error deleting user: ${error.message}`
    })
  }
})
