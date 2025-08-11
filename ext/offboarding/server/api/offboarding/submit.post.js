import { executeQuery } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const offboardingData = await readBody(event)

    if (!offboardingData.guid) {
      throw createError({ statusCode: 400, statusMessage: 'GUID is required' })
    }

    // Check if data for this GUID already exists
    const existingData = await executeQuery(
      'SELECT id FROM offboarding_data WHERE guid = ?',
      [offboardingData.guid]
    )

    if (existingData.length > 0) {
      await executeQuery(
        `UPDATE offboarding_data SET full_name = ?, email = ?, phone = ?,
          contract_file_url = ?, computer_photos_urls = ? WHERE guid = ?`,
        [
          offboardingData.fullName,
          offboardingData.email,
          offboardingData.phone,
          offboardingData.contractFileUrl,
          JSON.stringify(offboardingData.computerPhotosUrls),
          offboardingData.guid
        ]
      )
    } else {
      await executeQuery(
        `INSERT INTO offboarding_data(guid, full_name, email, phone, contract_file_url, computer_photos_urls)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [
          offboardingData.guid,
          offboardingData.fullName,
          offboardingData.email,
          offboardingData.phone,
          offboardingData.contractFileUrl,
          JSON.stringify(offboardingData.computerPhotosUrls)
        ]
      )
    }

    return { success: true, message: 'Offboarding data saved successfully' }
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to save offboarding data' })
  }
})