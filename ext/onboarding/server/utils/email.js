import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function sendEmail(config, { to, subject, html, attachments = [] }) {
  const mailgun = new Mailgun(FormData)
  const mg = mailgun.client({
    username: 'api',
    key: config.mailgunApiKey
  })

  try {
    const messageData = {
      from: `Lexart Team <noreply@${config.mailgunDomain}>`,
      to: [to],
      subject,
      html
    }

    // Add attachments if provided
    if (attachments.length > 0) {
      messageData.attachment = attachments
    }

    const result = await mg.messages.create(config.mailgunDomain, messageData)

    console.log('Email sent successfully:', result)
    return result
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export function generateOnboardingEmailTemplate(userData, kycData, appUrl, userId) {
  // Create approval link with user ID
  const approvalLink = `${appUrl}/api/users/approve?userId=${userId}`

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          .section h2 { margin-top: 0; color: #3498db; }
          .btn { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .btn:hover { background-color: #2980b9; }
          table { width: 100%; border-collapse: collapse; }
          table td { padding: 8px; border-bottom: 1px solid #ddd; }
          table td:first-child { font-weight: bold; width: 40%; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Onboarding Request</h1>

          <div class="section">
            <h2>User Information</h2>
            <table>
              <tr>
                <td>Name:</td>
                <td>${userData.name || 'N/A'}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td>${userData.email || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>KYC Information</h2>
            <table>
              <tr>
                <td>Full Name:</td>
                <td>${kycData.full_name || 'N/A'}</td>
              </tr>
              <tr>
                <td>Identity Document:</td>
                <td>${kycData.identity_document || 'N/A'}</td>
              </tr>
              <tr>
                <td>Full Address:</td>
                <td>${kycData.full_address || 'N/A'}</td>
              </tr>
              <tr>
                <td>Bank Information:</td>
                <td>${kycData.bank_information || 'N/A'}</td>
              </tr>
              <tr>
                <td>Country:</td>
                <td>${kycData.country || 'N/A'}</td>
              </tr>
              <tr>
                <td>IBAN:</td>
                <td>${kycData.iban || 'N/A'}</td>
              </tr>
              <tr>
                <td>Intermediary Bank:</td>
                <td>${kycData.intermediary_bank || 'N/A'}</td>
              </tr>
              <tr>
                <td>Phone:</td>
                <td>${kycData.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td>Emergency Phone:</td>
                <td>${kycData.emergency_phone || 'N/A'}</td>
              </tr>
              <tr>
                <td>Company Name:</td>
                <td>${kycData.company_name || 'N/A'}</td>
              </tr>
              <tr>
                <td>Company RUT:</td>
                <td>${kycData.company_rut || 'N/A'}</td>
              </tr>
              <tr>
                <td>Company Address:</td>
                <td>${kycData.company_address || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>Attached Documents</h2>
            <p>The signed NDA and Service Agreement documents are attached to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getContractAttachments(ndaContract, serviceAgreementContract) {
  const attachments = []
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts')

  try {
    // Add NDA contract if available
    if (ndaContract) {
      const ndaPath = join(uploadsDir, ndaContract)
      const ndaBuffer = readFileSync(ndaPath)
      attachments.push({
        filename: 'NDA_Contract.pdf',
        data: ndaBuffer
      })
    }

    // Add service agreement contract if available
    if (serviceAgreementContract) {
      const servicePath = join(uploadsDir, serviceAgreementContract)
      const serviceBuffer = readFileSync(servicePath)
      attachments.push({
        filename: 'Service_Agreement_Contract.pdf',
        data: serviceBuffer
      })
    }
  } catch (error) {
    console.error('Error preparing contract attachments:', error)
    // Continue without attachments if there's an error
  }

  return attachments
}
