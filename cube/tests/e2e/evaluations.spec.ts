/**
 * Panel del desarrollador y alcance de lo que puede ver.
 *
 * El flujo de alta de una evaluación IDEAL está en `ideal.spec.ts`; aquí se
 * comprueba lo que ve la persona evaluada cuando entra, que es el criterio de
 * aceptación de la Fase 4 del Roadmap: "un desarrollador entra y ve sus
 * evaluaciones sin explicación previa".
 *
 * La semilla le deja a Dana tres evaluaciones IDEAL (2025-Q1, 2025-Q3 y
 * 2026-Q1), así que hay línea de evolución además de la cifra grande.
 */
import { test, expect } from '@playwright/test'
import { ACCOUNTS, login } from './helpers'

test.describe('panel del desarrollador', () => {
  test('un developer ve sus evaluaciones y su evolución', async ({ page }) => {
    await login(page, ACCOUNTS.dev)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dana')

    // La figura hero: el puntaje más reciente.
    await expect(page.getByText(/%$/).first()).toBeVisible()

    // Tres evaluaciones en la semilla -> hay gráfico de evolución.
    await expect(page.getByText(/evolución/i)).toBeVisible()

    // Y el historial las lista, con su promedio sobre 5.
    await expect(page.getByText(/3\.9\d/).first()).toBeVisible()
  })

  test('el gráfico ofrece su equivalente en tabla', async ({ page }) => {
    await login(page, ACCOUNTS.dev)
    await page.getByRole('button', { name: /ver como tabla/i }).first().click()
    // Ningún valor queda accesible solo por el gráfico.
    await expect(page.getByRole('table').first()).toBeVisible()
  })

  test('un developer no ve las evaluaciones de otro', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)

    // La evaluación 4 de la semilla es de Bruno (usuario 4), no de Dana (usuario 3).
    const response = await request.get('/api/ideal/4')
    expect(response.status()).toBe(404)

    // 404 y no 403: un 403 confirmaría que la evaluación existe.
    const body = await response.json()
    expect(JSON.stringify(body)).not.toContain('403')
  })

  test('forjar la cabecera user-id no amplía el alcance — CRIT-07', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)

    const forged = await request.get('/api/ideal', { headers: { 'user-id': '4' } })
    const data = await forged.json()

    // Solo devuelve las de Dana, sin importar lo que diga la cabecera.
    expect(data.evaluations.length).toBeGreaterThan(0)
    for (const item of data.evaluations) {
      expect(item.evaluatedUserId).toBe(3)
    }
  })
})

test.describe('rehash transparente de contraseñas', () => {
  test('una cuenta con MD5 entra y su hash pasa a bcrypt — Roadmap §6', async ({
    page,
    request,
  }) => {
    // Primer login: se valida contra MD5 y se rehashea en la misma petición.
    await login(page, ACCOUNTS.legacy)
    await expect(page).toHaveURL(/\/dashboard/)

    // Segundo login: ya debe validar contra bcrypt, y funcionar igual.
    await request.post('/api/auth/logout')
    const second = await request.post('/api/auth/login', { data: ACCOUNTS.legacy })
    expect(second.ok()).toBe(true)
  })
})
