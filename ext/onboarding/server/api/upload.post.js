import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = form[0]
    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file'
      })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = path.extname(file.filename)
    const uniqueFilename = `${randomUUID()}${fileExtension}`
    const filePath = path.join(uploadsDir, uniqueFilename)

    // Save file
    await fs.writeFile(filePath, file.data)

    return {
      success: true,
      filename: uniqueFilename,
      url: `/uploads/${uniqueFilename}`
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'File upload failed'
    })
  }
})