import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de los tests end-to-end.
 *
 * Corren contra el build de producción, no contra `nuxt dev`: es lo que
 * realmente se despliega, y el modo desarrollo tiene comportamientos distintos
 * (HMR, sin minificar, CSP relajada) que enmascararían fallos reales.
 */
const PORT = Number(process.env.E2E_PORT ?? 3010)
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

  webServer: {
    command: 'node .output/server/index.mjs',
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'production',
      PORT: String(PORT),
    },
  },
})
