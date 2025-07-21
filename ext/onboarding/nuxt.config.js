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
    public: {
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || 'your-site-key'
    }
  }
})