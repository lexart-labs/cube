import tailwindcss from '@tailwindcss/vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: !isProduction },

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', 'nuxt-security', '@nuxt/eslint'],

  // Montserrat autoalojada: cargarla desde Google Fonts obligaría a abrir
  // `font-src` en la CSP y filtraría la IP de cada visitante a un tercero.
  css: ['@fontsource-variable/montserrat', '~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  /**
   * IMPORTANTE — no añadir valores por defecto a los secretos.
   *
   * Las claves deben declararse para que Nuxt las rellene desde NUXT_*, pero el
   * valor por defecto es siempre la cadena vacía. `server/plugins/00.bootstrap.ts`
   * valida esto en el arranque y **aborta** si algo falta o es débil.
   *
   * Esto es exactamente lo que v1 hacía mal (HIGH-05): al caer a
   * `'your-secret-key'`, un despliegue con la variable olvidada arrancaba con un
   * secreto que está publicado en el repositorio.
   */
  runtimeConfig: {
    sessionSecret: '',
    // Solo desarrollo. Ver server/utils/config.ts.
    seedOnStartup: 'false',
    // Redacción de las evaluaciones (NUXT_GEMINI_API_KEY / NUXT_GEMINI_MODEL).
    // Opcional a propósito: sin clave la aplicación arranca igual y solo esa
    // función queda deshabilitada.
    geminiApiKey: '',
    geminiModel: '',
    // Proxies inversos de confianza (NUXT_TRUSTED_PROXIES). Vacío = no se cree
    // `X-Forwarded-For` a nadie; ver server/utils/netmatch.ts.
    trustedProxies: '',
    db: {
      host: '',
      port: '3306',
      user: '',
      password: '',
      name: '',
      ssl: 'false',
    },
    public: {},
  },

  i18n: {
    defaultLocale: 'es',
    strategy: 'no_prefix',
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'pt', name: 'Português', file: 'pt.json' },
    ],
  },

  /**
   * Cabeceras de seguridad — cierra MED-03 de Security.md.
   * v1 no tenía helmet ni equivalente: ni CSP, ni HSTS, ni nosniff.
   */
  security: {
    strict: false,
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'base-uri': ["'none'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        // 'strict-dynamic' con nonce: los scripts se autorizan por nonce, no por
        // origen, así que no hace falta 'unsafe-inline' ni una allow-list de CDNs.
        // v1 cargaba Bootstrap y jQuery desde CDN de terceros; v2 no lo hace.
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        // Hojas de estilo: con nonce, sin 'unsafe-inline'.
        'style-src': isProduction ? ["'self'", "'nonce-{{nonce}}'"] : ["'self'", "'unsafe-inline'"],
        /**
         * Atributos `style` en línea, que es lo que generan los bindings
         * `:style` de Vue para valores dinámicos: el ancho de un medidor, la
         * posición de un punto en un gráfico.
         *
         * Sin esta directiva, CSP3 los rige con `style-src`, y al no llevar
         * 'unsafe-inline' el navegador los DESCARTA: en producción la interfaz
         * se renderizaba sin ninguno de esos colores ni tamaños.
         *
         * Se separa a propósito en lugar de relajar `style-src`: un atributo
         * `style` no puede ejecutar JavaScript, mientras que un `<style>` en
         * línea sí abre la puerta a exfiltración por selectores. El vector
         * peligroso sigue cerrado.
         */
        'style-src-attr': ["'unsafe-inline'"],
        'upgrade-insecure-requests': isProduction,
      },
      strictTransportSecurity: isProduction
        ? { maxAge: 31_536_000, includeSubdomains: true, preload: true }
        : false,
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      xFrameOptions: 'DENY',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
      },
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
    },
    // El límite fino por endpoint llega en la Fase 3 (MED-04); esto es el techo global.
    rateLimiter: {
      tokensPerInterval: 300,
      interval: 60_000,
      headers: true,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 2_000_000,
    },
    corsHandler: {
      origin: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  },

  /**
   * CORS de la API externa: lo resuelve `server/middleware/02.external.ts`.
   *
   * El `corsHandler` de nuxt-security fija un único origen —el de la propia
   * aplicación— y no sabe nada de las listas por clave, así que dejarlo activo
   * aquí significaría que ningún dominio autorizado podría llamar nunca desde
   * un navegador. Se desactiva SOLO en este prefijo; el resto de Cube sigue
   * con el origen único de siempre.
   */
  routeRules: {
    '/api/external/**': {
      security: {
        corsHandler: false,
      },
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
