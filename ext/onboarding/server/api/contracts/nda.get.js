import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { join } from 'path'

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
    jwt.verify(token, config.jwtSecret)
    
    // Path to your NDA PDF file
    const filePath = join(process.cwd(), 'public', 'contracts', 'NDA_Contract.pdf')
    const fileBuffer = readFileSync(filePath)
    
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', 'attachment; filename="NDA_Contract.pdf"')
    
    return fileBuffer
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    })
  }
})