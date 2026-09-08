import jwt from 'jsonwebtoken'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

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
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const fileData = formData.find(item => item.name === 'file')
    const typeData = formData.find(item => item.name === 'type')
    
    if (!fileData || !typeData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing file or type'
      })
    }

    const type = typeData.data.toString()
    const allowedTypes = ['nda', 'service']
    
    if (!allowedTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid contract type'
      })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = '.pdf'
    const filename = `${decoded.userId}_${type}_${randomUUID()}${fileExtension}`
    const filePath = join(uploadsDir, filename)

    // Save file
    writeFileSync(filePath, fileData.data)

    return {
      success: true,
      filename: filename,
      type: type
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload contract'
    })
  }
})