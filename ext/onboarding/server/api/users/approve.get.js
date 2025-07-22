import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
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

    // Redirect to a success page or return a success message
    return sendRedirect(event, '/approval-success.html')
  } catch (error) {
    console.error('Error approving user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error approving user: ${error.message}`
    })
  }
})