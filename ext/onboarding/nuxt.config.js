export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || 'password',
    dbName: process.env.DB_NAME || 'onboarding_db',
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || 'your-secret-key',
    mailgunApiKey: process.env.MAILGUN_API_KEY || 'your-mailgun-api-key',
    mailgunDomain: process.env.MAILGUN_DOMAIN || 'your-mailgun-domain',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    emailOnboarding: process.env.EMAIL_ONBOARDING || 'your-email@example.com',
		apiKey: process.env.API_KEY || 'your-super-secret-api-key-for-backend-communication',
    public: {
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || 'your-site-key'
    },
		cubeApiUrl: process.env.CUBE_API_URL || 'http://localhost:3001',
		cubeApiToken: process.env.CUBE_API_TOKEN || 'your-super-secret-api-key-for-cube-communication',
		trackingApiUrl: process.env.TRACKING_API_URL || 'http://localhost:3002',
		trackingApiToken: process.env.TRACKING_API_TOKEN || 'your-super-secret-api-key-for-tracking-communication',
  }
})
