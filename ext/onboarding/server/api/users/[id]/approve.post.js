import { executeQuery } from '~/server/utils/database'
import { validateApiKey } from '~/server/utils/apiAuth'
import { sendEmail } from '~/server/utils/email'
import axios from 'axios'

export default defineEventHandler(async (event) => {
  validateApiKey(event)

  try {
    const userId = getRouterParam(event, 'id')
    const config = useRuntimeConfig()

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Get user details from onboarding system
    const userQuery = `
      SELECT pu.*, kyc.full_name, kyc.phone, kyc.country
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

    // 2. Create user in Google Workspace
    const googleWorkspaceResult = await createGoogleWorkspaceUser({
      firstName,
      lastName,
      email: workEmail,
      password: securePassword,
      phone: user.phone,
      country: user.country
    })

    // 3. Create user in Cube system
    const cubeUserResult = await createCubeUser({
      name: user.full_name || user.name,
      email: workEmail,
      password: securePassword,
      originalEmail: user.email,
      phone: user.phone,
      country: user.country
    })

    // 4. Create user in Tracking system
    const trackingUserResult = await createTrackingUser({
      name: user.full_name || user.name,
      email: workEmail,
      password: securePassword,
      role: 'developer'
    })

    // 5. Send welcome email with credentials
    await sendWelcomeEmail({
      name: user.full_name || user.name,
      personalEmail: user.email,
      workEmail,
      password: securePassword,
      googleWorkspaceResult,
      cubeSystem: cubeUserResult,
      trackingSystem: trackingUserResult
    })

		console.log("googleWorkspaceResult", googleWorkspaceResult)
		console.log("cubeUserResult", cubeUserResult)
		console.log("trackingUserResult", trackingUserResult)

    return {
      success: true,
      message: 'User approved and created across all systems successfully',
      data: {
        userId,
        workEmail,
        googleWorkspace: googleWorkspaceResult.success,
        cubeSystem: cubeUserResult.success,
        trackingSystem: trackingUserResult.success
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

    // Google Workspace Admin SDK API call
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
        orgUnitPath: '/Employees'
      },
      {
        headers: {
          'Authorization': `Bearer ${config.googleWorkspaceAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    console.error('Google Workspace user creation failed:', error)
    return { success: false, error: error.message }
  }
}

async function createCubeUser(userData) {
  try {
    const config = useRuntimeConfig()
		console.log("create CUBE explore data: ", userData)
    const response = await axios.post(
      `${config.cubeApiUrl}/users/upsert`,
      {
        // Required fields with defaults
        id: userData.id || null,
        idUser: userData.id || null,
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
        lead: userData.lead || { id: userData.id || null, name: userData.name },

        // Sync flag
        sync: true,

        // Original fields for reference
        originalEmail: userData.originalEmail,
        phone: userData.phone,
        country: userData.country
      },
      {
        headers: {
          'token': `${config.cubeApiToken}`,
          'Content-Type': 'application/json',
          'company_slug': 'lexart_labs' // Add company slug header
        }
      }
    )

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
      `${config.trackingApiUrl}/api/user/register`,
      {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      },
      {
        headers: {
          'Authorization': `Bearer ${config.trackingApiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    console.error('Tracking user creation failed:', error)
    return { success: false, error: error.message }
  }
}

async function sendWelcomeEmail(data) {
	const config = useRuntimeConfig()
	console.log("data send email : ", data)
	try {
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
			subject: 'Welcome to Lexart - Your Account Details',
			html: emailTemplate
		})
	} catch (e){
		console.error('Welcome email send failed:', e)
    return { success: false, error: e.message }
	}
}
