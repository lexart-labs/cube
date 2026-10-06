import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de los tests end-to-end.
 *
 * Corren contra el build de producción, no contra `nuxt dev`: es lo que
 * realmente se despliega, y el modo desarrollo tiene comportamientos distintos
 * (HMR, sin minificar, CSP relajada) que enmascararían fallos reales.
 *
 * Arranca DOS servidores contra la misma base: el principal, tal cual se
 * despliega, y uno con NUXT_EMBED_ORIGINS para probar el embebido en iframe
 * con las cabeceras de verdad (ver tests/e2e/security.spec.ts). No basta con
 * el unitario de parseEmbedOrigin porque la vía completa pasa por el hook de
 * nuxt-security y su render:response, y eso solo existe contra el build.
 */
const PORT = Number(process.env.E2E_PORT ?? 3010)
const EMBED_PORT = Number(process.env.E2E_EMBED_PORT ?? 3011)
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  // Secuencial: los tests comparten una base de datos y varios mutan datos.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 30_000,

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      command: 'node .output/server/index.mjs',
      url: `${baseURL}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        PORT: String(PORT),
      },
    },
    {
      // El mismo build con el embebido abierto: la única diferencia es la
      // variable, que es lo único que debe cambiar el comportamiento.
      command: 'node .output/server/index.mjs',
      url: `http://127.0.0.1:${EMBED_PORT}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        PORT: String(EMBED_PORT),
        NUXT_EMBED_ORIGINS: 'platform.lexart.tech,*.lexart.tech',
      },
    },
  ],
})
