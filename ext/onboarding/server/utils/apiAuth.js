export function validateApiKey(event) {
  const config = useRuntimeConfig()
  const apiKey = getHeader(event, 'X-API-Key') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API key required'
    })
  }
	console.log("apiKey: ", apiKey)
  if (apiKey !== config.apiKey) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid API key'
    })
  }

  return true
}
