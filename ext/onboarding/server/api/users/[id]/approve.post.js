import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'
import { sendEmail } from '~/server/utils/email'
import { promises as fs, readFileSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { JWT } from 'google-auth-library'
import FormData from 'form-data' // Add this import

export default defineEventHandler(async (event) => {
  validateApiKey(event)

  try {
    const userId = getRouterParam(event, 'id')
    const config = useRuntimeConfig()
    const body = await readBody(event)

		// Get user-id from header and define as userIdFromCube
  	const userIdFromCube = getHeader(event, 'user-id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Get user details from onboarding system including existing contracts
    const userQuery = `
      SELECT pu.*, kyc.full_name, kyc.phone, kyc.country,
             kyc.lexart_signed_nda, kyc.lexart_signed_service_agreement
      FROM pending_users pu
      LEFT JOIN pending_users_kyc_data kyc ON pu.id = kyc.user_id
      WHERE pu.id = ?
    `
    const userData = await executeQuery(userQuery, [userId])

    if (userData.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    const user = userData[0]
    console.log("userData :: ", user)

    // Generate email and secure password
    const emailDomain = '@lexartlabs.xyz'
    const nameParts = user.full_name ? user.full_name.toLowerCase().split(' ') : user.name.toLowerCase().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1]
    const workEmail = `${firstName}.${lastName}${emailDomain}`

    // Generate secure password
    const securePassword = generateSecurePassword()

    // 1. Update onboarding status to approved
    await executeQuery(
      'UPDATE pending_users SET kyc_status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    )

    // 2. Handle signed contracts upload if provided AND fetch existing contracts
    let signedContractsResult = { success: true, files: {} }

    // Upload new contracts if provided
    if (body.signedContracts) {
      signedContractsResult = await uploadSignedContracts(userId, body.signedContracts)
    }

    // Fetch existing contracts from database
    const existingContracts = await fetchExistingContracts(user)

    // Merge existing and new contracts
    const allContracts = { ...existingContracts, ...signedContractsResult.files }

    // 3. Create user in Google Workspace
    const googleWorkspaceResult = await createGoogleWorkspaceUser({
      firstName,
      lastName,
      email: workEmail,
      password: securePassword,
      phone: user.phone,
      country: user.country
    })

    // 4. Create user in Cube system
    const cubeUserResult = await createCubeUser({
      name: user.full_name || user.name,
      email: workEmail,
      password: securePassword,
      originalEmail: user.email,
      phone: user.phone,
      country: user.country,
			idUser: userIdFromCube
    })

    // 5. Create user in Tracking system
    const trackingUserResult = await createTrackingUser({
      name: user.full_name || user.name,
      email: workEmail,
      password: securePassword,
      role: 'developer'
    })

    // 6. Send welcome email with credentials and all signed contracts (existing + new)
    await sendWelcomeEmail({
      name: user.full_name || user.name,
      personalEmail: user.email,
      workEmail,
      password: securePassword,
      googleWorkspaceResult,
      cubeSystem: cubeUserResult,
      trackingSystem: trackingUserResult,
      signedContracts: allContracts
    })

    // 7. Send admin notification email with Google Drive upload
    await sendAdminNotificationEmail({
      name: user.full_name || user.name,
      personalEmail: user.email,
      workEmail,
      password: securePassword,
      phone: user.phone,
      country: user.country,
      googleWorkspaceResult,
      cubeSystem: cubeUserResult,
      trackingSystem: trackingUserResult,
      signedContracts: allContracts
    })

    console.log("googleWorkspaceResult", googleWorkspaceResult)
    console.log("cubeUserResult", cubeUserResult)
    console.log("trackingUserResult", trackingUserResult)
    console.log("signedContractsResult", signedContractsResult)

    return {
      success: true,
      message: 'User approved and created across all systems successfully',
      data: {
        userId,
        workEmail,
        googleWorkspace: googleWorkspaceResult.success,
        cubeSystem: cubeUserResult.success,
        trackingSystem: trackingUserResult.success,
        signedContracts: signedContractsResult.success
      }
    }

  } catch (error) {
    console.error('Error in approval process:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Error in approval process: ${error.message}`
    })
  }
})

// New function to handle signed contracts upload
async function uploadSignedContracts(userId, signedContracts) {
  try {
    const results = {}

    // Create uploads directory for signed documents
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'signed-documents')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Process NDA contract if provided
    if (signedContracts.nda) {
      const ndaResult = await saveSignedContract(userId, 'nda', signedContracts.nda, uploadsDir)
      results.nda = ndaResult

      // Update database
      await executeQuery(
        'UPDATE pending_users_kyc_data SET lexart_signed_nda = ? WHERE user_id = ?',
        [ndaResult.filename, userId]
      )
    }

    // Process Service Agreement contract if provided
    if (signedContracts.service_agreement) {
      const saResult = await saveSignedContract(userId, 'service_agreement', signedContracts.service_agreement, uploadsDir)
      results.service_agreement = saResult

      // Update database
      await executeQuery(
        'UPDATE pending_users_kyc_data SET lexart_signed_service_agreement = ? WHERE user_id = ?',
        [saResult.filename, userId]
      )
    }

    return { success: true, files: results }
  } catch (error) {
    console.error('Error uploading signed contracts:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to save individual signed contract
async function saveSignedContract(userId, contractType, contractData, uploadsDir) {
  try {
    // Validate contract data (should be base64 or buffer)
    let fileBuffer
    if (typeof contractData === 'string') {
      // Assume base64 encoded
      fileBuffer = Buffer.from(contractData, 'base64')
    } else if (Buffer.isBuffer(contractData)) {
      fileBuffer = contractData
    } else {
      throw new Error('Invalid contract data format')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueId = randomUUID()
    const filename = `${userId}_${contractType}_lexart_signed_${timestamp}_${uniqueId}.pdf`
    const filePath = path.join(uploadsDir, filename)

    // Save file
    await fs.writeFile(filePath, fileBuffer)

    return {
      filename,
      url: `/uploads/signed-documents/${filename}`,
      size: fileBuffer.length
    }
  } catch (error) {
    console.error(`Error saving ${contractType} contract:`, error)
    throw error
  }
}

// Helper functions
function generateSecurePassword() {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

async function createGoogleWorkspaceUser(userData) {
  try {
    const config = useRuntimeConfig()

    console.log('Google Service Account Email:', config.googleServiceAccountEmail)
    console.log('Google Admin Email:', config.googleAdminEmail)
    console.log('Service Account Key exists:', !!config.googleServiceAccountKey)

    // Create JWT client with service account
    const jwtClient = new JWT({
      email: config.googleServiceAccountEmail,
      key: config.googleServiceAccountKey,
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata'
      ],
      subject: config.googleAdminEmail // Admin email to impersonate
    })

    // Get access token
    console.log('Getting access token...')
    const { token } = await jwtClient.getAccessToken()
    console.log('Access token obtained successfully')

    console.log('Creating user with data:', {
      primaryEmail: userData.email,
      givenName: userData.firstName,
      familyName: userData.lastName
    })

    const response = await axios.post(
      `https://admin.googleapis.com/admin/directory/v1/users`,
      {
        primaryEmail: userData.email,
        name: {
          givenName: userData.firstName,
          familyName: userData.lastName
        },
        password: userData.password,
        changePasswordAtNextLogin: true,
        phones: userData.phone ? [{
          value: userData.phone,
          type: 'work'
        }] : [],
        orgUnitPath: '/' // Changed from '/Employees' to root
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    console.error('Google Workspace user creation failed:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    return { success: false, error: error.message }
  }
}

async function createCubeUser(userData) {
  try {
    const config = useRuntimeConfig()
		const headers = {
        headers: {
          'token': `${config.cubeApiToken}`,
          'Content-Type': 'application/json',
          'company_slug': 'lexart_labs',
					'user-id': userData.idUser
        }
    }
		console.log("create CUBE explore data: ", userData)
    const response = await axios.post(
      `${config.cubeApiUrl}/users/upsert`,
      {
        // Required fields with defaults
        id: userData.id || null,
        idUser: userData.idUser,
        idLextracking: null,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        type: userData.type || 'developer',
        active: userData.active || 1,
        token: '',

        // Position and level fields with defaults
        positionId: userData.positionId || 16, // Default to "Developer Care Manager"
        levelId: userData.levelId || 9, // Default to "Administración"
        idPosition: userData.idPosition || null,

        // Platform and company fields - FIXED
        idPlataform: userData.idPlataform || null,
        idCompany: 1, // Use valid company ID, not false
        idCareerType: userData.idCareerType || 3, // Default career type

        // Additional fields with defaults
        skills: userData.skills || {},
        roadmap: userData.roadmap || '[]',
        minimumTime: userData.minimumTime || 0,
        since: 0,

        // Lead information
        lead: {
					id: userData.idUser
				},

        // Sync flag
        sync: true,

        // Original fields for reference
        originalEmail: userData.originalEmail,
        phone: userData.phone,
        country: userData.country
      },
      headers
    )

		console.log("Result headers CUBE :: ", headers)

    return { success: true, data: JSON.stringify(response.data) }
  } catch (error) {
    console.error('Cube user creation failed:', error)
    return { success: false, error: error.message }
  }
}

async function createTrackingUser(userData) {
  try {
    const config = useRuntimeConfig()

    const response = await axios.post(
      `${config.trackingApiUrl}/user/register`,
      {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: "developer", // use this role fixed for now
        idSlack: userData.idSlack || "",
        idClient: userData.idClient || null,
        image_base: userData.image_base || ""
      },
      {
        headers: {
          'Authorization': `Bearer ${config.trackingApiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Updated to handle the new response structure
    return { success: true, data: response.data.response }
  } catch (error) {
    console.error('Tracking user creation failed:', error)
    return { success: false, error: error.message }
  }
}

async function sendWelcomeEmail(data) {
  const config = useRuntimeConfig()
  console.log("data send email : ", data)
  try {
    // Prepare attachments for signed contracts using the same pattern as submit.post.js
    const attachments = []
    if (data.signedContracts) {
      if (data.signedContracts.nda) {
        try {
          const ndaPath = path.join(process.cwd(), 'public', data.signedContracts.nda.url)
          const ndaBuffer = readFileSync(ndaPath)
          attachments.push({
            filename: 'NDA_Signed_by_Lexart.pdf',
            data: ndaBuffer
          })
        } catch (error) {
          console.error('Error reading NDA file:', error)
        }
      }
      if (data.signedContracts.service_agreement) {
        try {
          const servicePath = path.join(process.cwd(), 'public', data.signedContracts.service_agreement.url)
          const serviceBuffer = readFileSync(servicePath)
          attachments.push({
            filename: 'Service_Agreement_Signed_by_Lexart.pdf',
            data: serviceBuffer
          })
        } catch (error) {
          console.error('Error reading Service Agreement file:', error)
        }
      }
    }

    const emailTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            .credentials-box { background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .system-status { margin: 10px 0; padding: 10px; border-radius: 4px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; }
            .contracts-info { background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Lexart Labs!</h1>
            <p>Hello ${data.name},</p>
            <p>Your onboarding application has been approved! Your accounts have been created across all Lexart systems.</p>

            <div class="credentials-box">
              <h3>Your Work Credentials</h3>
              <p><strong>Work Email:</strong> ${data.workEmail}</p>
              <p><strong>Password:</strong> ${data.password}</p>
              <p><em>Please change your password after first login</em></p>
            </div>

            ${data.signedContracts && Object.keys(data.signedContracts).length > 0 ? `
            <div class="contracts-info">
              <h3>📄 Signed Contracts</h3>
              <p>Please find your signed contracts attached to this email:</p>
              <ul>
                ${data.signedContracts.nda ? '<li>✅ NDA (Non-Disclosure Agreement) - Signed by Lexart</li>' : ''}
                ${data.signedContracts.service_agreement ? '<li>✅ Service Agreement - Signed by Lexart</li>' : ''}
              </ul>
              <p><em>These documents are legally binding and represent our commitment to the agreed terms.</em></p>
            </div>
            ` : ''}

            <h3>System Access Status:</h3>
            <div class="system-status ${data?.googleWorkspaceResult?.success ? 'success' : 'warning'}">
              <strong>Google Workspace:</strong> ${data?.googleWorkspaceResult?.success ? '✅ Created' : '⚠️ Pending'}
            </div>
            <div class="system-status ${data?.cubeSystem?.success ? 'success' : 'warning'}">
              <strong>Cube System:</strong> ${data?.cubeSystem?.success ? '✅ Created' : '⚠️ Pending'}
            </div>
            <div class="system-status ${data?.trackingSystem?.success ? 'success' : 'warning'}">
              <strong>Tracking System:</strong> ${data?.trackingSystem?.success ? '✅ Created' : '⚠️ Pending'}
            </div>

            <p>Next steps:</p>
            <ol>
              <li>Review and keep the attached signed contracts for your records</li>
              <li>Check your Google Workspace email</li>
              <li>Access the Cube system for project management</li>
              <li>Log into the Tracking system for time tracking</li>
              <li>Complete any remaining onboarding tasks</li>
            </ol>
          </div>
        </body>
      </html>
    `

    await sendEmail(config, {
      to: data.personalEmail,
      subject: 'Welcome to Lexart - Your Account Details & Signed Contracts',
      html: emailTemplate,
      attachments: attachments.length > 0 ? attachments : undefined
    })
  } catch (e) {
    console.error('Welcome email send failed:', e)
    return { success: false, error: e.message }
  }
}

// New function to fetch existing contracts from database
async function fetchExistingContracts(user) {
  try {
    const contracts = {}

    // Check for existing NDA
    if (user.lexart_signed_nda) {
      contracts.nda = {
        filename: user.lexart_signed_nda,
        url: `/uploads/signed-documents/${user.lexart_signed_nda}`,
        existing: true
      }
    }

    // Check for existing Service Agreement
    if (user.lexart_signed_service_agreement) {
      contracts.service_agreement = {
        filename: user.lexart_signed_service_agreement,
        url: `/uploads/signed-documents/${user.lexart_signed_service_agreement}`,
        existing: true
      }
    }

    return contracts
  } catch (error) {
    console.error('Error fetching existing contracts:', error)
    return {}
  }
}

// Add this function after the sendWelcomeEmail function
async function sendAdminNotificationEmail(data) {
  const config = useRuntimeConfig()
  console.log("Sending admin notification for user:", data.name)

  try {
    // Upload contracts to Google Drive first
    const driveUploadResults = await uploadContractsToGoogleDrive(data.signedContracts, data)

    const adminEmailTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; background-color: #ecf0f1; padding: 15px; border-radius: 8px; }
            .user-info { background-color: #f8f9fa; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .system-status { margin: 10px 0; padding: 10px; border-radius: 4px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; }
            .drive-links { background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .credentials { background-color: #fff3e0; border: 1px solid #ff9800; border-radius: 4px; padding: 15px; margin: 15px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 New Employee Onboarding Completed</h1>
            <p>Hello Admin Team,</p>
            <p>A new employee has successfully completed the onboarding process and all system accounts have been created.</p>

            <div class="user-info">
              <h3>👤 Employee Information</h3>
              <table class="table">
                <tr><th>Name</th><td>${data.name}</td></tr>
                <tr><th>Personal Email</th><td>${data.personalEmail}</td></tr>
                <tr><th>Work Email</th><td>${data.workEmail}</td></tr>
                <tr><th>Phone</th><td>${data.phone || 'Not provided'}</td></tr>
                <tr><th>Country</th><td>${data.country || 'Not provided'}</td></tr>
                <tr><th>Onboarding Date</th><td>${new Date().toLocaleDateString()}</td></tr>
              </table>
            </div>

            <div class="credentials">
              <h3>🔐 Generated Credentials</h3>
              <p><strong>Work Email:</strong> ${data.workEmail}</p>
              <p><strong>Temporary Password:</strong> *****</p>
              <p><em>Employee will be required to change password on first login</em></p>
            </div>

            <h3>🖥️ System Creation Status:</h3>
            <div class="system-status ${data?.googleWorkspaceResult?.success ? 'success' : 'warning'}">
              <strong>Google Workspace:</strong> ${data?.googleWorkspaceResult?.success ? '✅ Successfully Created' : '⚠️ Failed - Requires Manual Setup'}
            </div>
            <div class="system-status ${data?.cubeSystem?.success ? 'success' : 'warning'}">
              <strong>Cube System:</strong> ${data?.cubeSystem?.success ? '✅ Successfully Created' : '⚠️ Failed - Requires Manual Setup'}
            </div>
            <div class="system-status ${data?.trackingSystem?.success ? 'success' : 'warning'}">
              <strong>Tracking System:</strong> ${data?.trackingSystem?.success ? '✅ Successfully Created' : '⚠️ Failed - Requires Manual Setup'}
            </div>

            ${driveUploadResults && driveUploadResults.length > 0 ? `
            <div class="drive-links">
              <h3>📁 Signed Contracts (Google Drive)</h3>
              <p>The following signed contracts have been uploaded to Google Drive:</p>
              <ul>
                ${driveUploadResults.map(result => `
                  <li>
                    <strong>${result.contractType}:</strong>
                    <a href="${result.webViewLink}" target="_blank">${result.fileName}</a>
                    <br><small>Drive ID: ${result.fileId}</small>
                  </li>
                `).join('')}
              </ul>
              <p><em>All contracts are stored in the "Employee Contracts" folder in Google Drive.</em></p>
            </div>
            ` : ''}

            <h3>📋 Next Steps for Admin:</h3>
            <ol>
              <li>Verify all system accounts are properly configured</li>
              <li>Add employee to relevant groups and organizational units</li>
              <li>Set up time tracking projects in Tracking system</li>
              <li>Schedule orientation meeting with the new employee</li>
              <li>Review signed contracts in Google Drive</li>
            </ol>

            <hr>
            <p><small>This is an automated notification from the Lexart Labs Onboarding System.</small></p>
          </div>
        </body>
      </html>
    `

    await sendEmail(config, {
      to: config.emailOnboarding, // Admin email from config
      subject: `🎉 New Employee Onboarded: ${data.name} - Action Required`,
      html: adminEmailTemplate
    })

    console.log('Admin notification email sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Admin notification email failed:', error)
    return { success: false, error: error.message }
  }
}

// Function to upload contracts to Google Drive
async function uploadContractsToGoogleDrive(signedContracts, userData) {
  if (!signedContracts || Object.keys(signedContracts).length === 0) {
    return []
  }

  try {
    const config = useRuntimeConfig()

    // Create JWT client with Google Drive scope
    const jwtClient = new JWT({
      email: config.googleServiceAccountEmail,
      key: config.googleServiceAccountKey,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata'
      ],
      subject: config.googleAdminEmail
    })

    const { token } = await jwtClient.getAccessToken()

    // Create or find the "Employee Contracts" folder
    const folderId = await createOrFindContractsFolder(token)

    const uploadResults = []

    // Upload each contract
    for (const [contractType, contractData] of Object.entries(signedContracts)) {
      if (contractData && contractData.url) {
        try {
          const filePath = path.join(process.cwd(), 'public', contractData.url)
          const fileBuffer = readFileSync(filePath)

          const fileName = `${userData.name.replace(/\s+/g, '_')}_${contractType}_${new Date().toISOString().split('T')[0]}.pdf`

          // Upload to Google Drive
          const uploadResult = await uploadFileToGoogleDrive(token, fileBuffer, fileName, folderId)

          uploadResults.push({
            contractType: contractType.replace('_', ' ').toUpperCase(),
            fileName: fileName,
            fileId: uploadResult.id,
            webViewLink: uploadResult.webViewLink
          })
        } catch (error) {
          console.error(`Error uploading ${contractType}:`, error)
        }
      }
    }

    return uploadResults
  } catch (error) {
    console.error('Error uploading contracts to Google Drive:', error)
    return []
  }
}

// Helper function to create or find contracts folder
async function createOrFindContractsFolder(token) {
  try {
    // Search for existing folder
    const searchResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files?q=name='Employee Contracts' and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id
    }

    // Create new folder if not found
    const createResponse = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      {
        name: 'Employee Contracts',
        mimeType: 'application/vnd.google-apps.folder'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return createResponse.data.id
  } catch (error) {
    console.error('Error creating/finding contracts folder:', error)
    throw error
  }
}

// Helper function to upload file to Google Drive
async function uploadFileToGoogleDrive(token, fileBuffer, fileName, folderId) {
  try {
    const metadata = {
      name: fileName,
      parents: [folderId]
    }

    const form = new FormData()
    form.append('metadata', JSON.stringify(metadata), { contentType: 'application/json' })
    form.append('file', fileBuffer, { filename: fileName, contentType: 'application/pdf' })

    const response = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      form,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error)
    throw error
  }
}
