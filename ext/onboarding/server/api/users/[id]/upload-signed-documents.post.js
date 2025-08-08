import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'

export default defineEventHandler(async (event) => {
  // Validate API key for backend-to-backend communication
  validateApiKey(event)

  try {
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files uploaded'
      })
    }

    // Get user ID from route parameter
    const userId = getRouterParam(event, 'id')
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const results = {}

    // Create uploads directory for signed documents
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'signed-documents')
    await fs.mkdir(uploadsDir, { recursive: true })

    for (const file of form) {
      if (!file.filename || !file.data || !file.name) {
        continue
      }

      // Validate file type (PDF only for signed documents)
      const fileExtension = path.extname(file.filename).toLowerCase()
      if (fileExtension !== '.pdf') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Only PDF files are allowed for signed documents'
        })
      }

      // Validate field names
      if (!['nda', 'service_agreement'].includes(file.name)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid field name. Only "nda" and "service_agreement" are allowed.'
        })
      }

      // Generate unique filename
      const uniqueFilename = `${userId}_${file.name}_${randomUUID()}${fileExtension}`
      const filePath = path.join(uploadsDir, uniqueFilename)

      // Save file
      await fs.writeFile(filePath, file.data)

      results[file.name] = {
        filename: uniqueFilename,
        url: `/uploads/signed-documents/${uniqueFilename}`
      }

      // Update database based on document type
      if (file.name === 'nda') {
        await executeQuery(
          'UPDATE pending_users_kyc_data SET lexart_signed_nda = ? WHERE user_id = ?',
          [uniqueFilename, userId]
        )
      } else if (file.name === 'service_agreement') {
        await executeQuery(
          'UPDATE pending_users_kyc_data SET lexart_signed_service_agreement = ? WHERE user_id = ?',
          [uniqueFilename, userId]
        )
      }
    }

    return {
      success: true,
      files: results
    }
  } catch (error) {
    console.error('Signed documents upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'File upload failed'
    })
  }
})
