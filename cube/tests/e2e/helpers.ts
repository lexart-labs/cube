import type { Page, APIRequestContext } from '@playwright/test'

/** Cuentas de la semilla (`server/db/seed.ts`). */
export const ACCOUNTS = {
  admin: { email: 'admin@cube.test', password: 'cube-demo-2026!' },
  lead: { email: 'lead@cube.test', password: 'cube-demo-2026!' },
  dev: { email: 'dev@cube.test', password: 'cube-demo-2026!' },
  dev2: { email: 'dev2@cube.test', password: 'cube-demo-2026!' },
  legacy: { email: 'legacy@cube.test', password: 'cube-demo-2026!' },
} as const

/** Inicia sesión por la interfaz, como lo haría una persona. */
export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(account.email)
  await page.locator('#password').fill(account.password)
  await page.getByRole('button', { name: /entrar|sign in/i }).click()
  await page.waitForURL(/\/(dashboard|evaluations)/)
}

/** Inicia sesión por API y devuelve la cookie, para las pruebas de acceso. */
export async function apiLogin(
  request: APIRequestContext,
  account: { email: string; password: string },
) {
  const response = await request.post('/api/auth/login', { data: account })
  if (!response.ok()) throw new Error(`Login fallido: ${response.status()}`)
  return response
}
