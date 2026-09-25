/**
 * Evaluación IDEAL LEXART de extremo a extremo.
 *
 * Ninguno de estos tests llama a Gemini: el CI no tiene clave y una prueba que
 * dependa de un modelo generativo no es determinista. Lo que se comprueba es
 * todo lo demás —el formulario por rol, el promedio, el alcance por rol y que
 * **la evaluación se guarda aunque la IA no esté disponible**—, que es
 * justamente la parte que puede romperse sin que nadie lo note.
 */
import { test, expect } from '@playwright/test'
import { ACCOUNTS, apiLogin, login } from './helpers'

/** Notas completas para un rol, tal como las espera la API. */
const ARQUITECTO_L1 = {
  hardSkills: [4, 4, 4, 4, 4],
  leadership: [3, 3, 3, 3, 3],
  comercial: [5, 5],
  idiomas: [3],
}

test.describe('formulario', () => {
  test('pinta los bloques del rol y los repinta al cambiarlo', async ({ page }) => {
    await login(page, ACCOUNTS.lead)
    await page.goto('/evaluations/new')

    // Arquitecto L1 es el primero del catálogo: Hard Skills, Liderazgo,
    // Comercial e Idiomas.
    await expect(page.getByRole('heading', { name: 'Hard Skills' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Liderazgo' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comercial' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SDLC' })).toHaveCount(0)

    // El desplegable de colaboradores se llena de verdad. Sin esto, un cambio
    // en la forma de la respuesta de /api/users deja el formulario inservible
    // sin que falle nada más.
    await expect(page.getByLabel(/colaborador/i).locator('option')).not.toHaveCount(1)
    await expect(page.getByLabel(/colaborador/i)).toContainText('Dana Dev')

    await page.getByLabel(/rol a evaluar/i).selectOption('desarrollador-l3')

    // Desarrollador L3 cambia dos bloques enteros.
    await expect(page.getByRole('heading', { name: 'SDLC' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Autonomía' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Liderazgo' })).toHaveCount(0)
  })

  test('el promedio en vivo usa la misma fórmula que el servidor', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    await page.goto('/evaluations/new')

    // Todo a 3 de salida: el promedio ponderado de cualquier rol es 3.00.
    await expect(page.getByText('3.00').first()).toBeVisible()

    // Y el servidor, con las mismas notas, devuelve lo mismo.
    await apiLogin(request, ACCOUNTS.lead)
    const response = await request.post('/api/ideal', {
      data: {
        evaluatedUserId: 3,
        roleKey: 'arquitecto-l1',
        evaluatedOn: '2026-09-11',
        scores: {
          hardSkills: [3, 3, 3, 3, 3],
          leadership: [3, 3, 3, 3, 3],
          comercial: [3, 3],
          idiomas: [3],
        },
      },
    })
    expect(response.ok()).toBeTruthy()
    expect((await response.json()).weightedAverage).toBe(3)
  })

  test('un developer no entra en la pantalla de evaluación', async ({ page }) => {
    await login(page, ACCOUNTS.dev)
    await page.goto('/evaluations/new')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('consulta', () => {
  test('lo que se guarda aparece en el listado y se puede abrir', async ({ page }) => {
    await login(page, ACCOUNTS.lead)
    await page.goto('/evaluations/new')

    await page.getByLabel(/colaborador/i).selectOption({ label: 'Dana Dev' })
    await page.getByRole('button', { name: /generar evaluación/i }).click()

    // El promedio se ve en cuanto la evaluación está guardada, haya IA o no.
    await expect(page.getByText('3.00').first()).toBeVisible()

    await page.goto('/evaluations')
    await expect(page.getByRole('link', { name: 'Dana Dev' }).first()).toBeVisible()

    await page.getByRole('link', { name: 'Dana Dev' }).first().click()
    await expect(page).toHaveURL(/\/evaluations\/\d+/)
    // El detalle reconstruye el cuestionario del rol con el que se evaluó.
    await expect(page.getByRole('heading', { name: 'Hard Skills' })).toBeVisible()
  })

  test('un developer ve su propia evaluación IDEAL', async ({ page }) => {
    await login(page, ACCOUNTS.dev)
    await page.goto('/evaluations')
    // No la puede crear, pero sí consultarla: es su evaluación.
    await expect(page.getByRole('link', { name: /nueva evaluación/i })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('API', () => {
  test('la evaluación se guarda aunque la IA no esté configurada', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)

    const response = await request.post('/api/ideal', {
      data: {
        evaluatedUserId: 3,
        roleKey: 'arquitecto-l1',
        evaluatedOn: '2026-09-11',
        scores: ARQUITECTO_L1,
        observations: 'Semestre sólido.',
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()

    // 4·0.45 + 3·0.35 + 5·0.10 + 3·0.10 = 1.8 + 1.05 + 0.5 + 0.3 = 3.65
    expect(body.weightedAverage).toBe(3.65)
    expect(body.scorePercent).toBe(73)
    expect(body.id).toBeGreaterThan(0)

    // Sin clave: se guarda igual y lo dice. Con clave: llega la redacción.
    expect(['ok', 'disabled', 'failed']).toContain(body.aiStatus)

    // Y queda consultable, con narrativa o sin ella.
    const detail = await request.get(`/api/ideal/${body.id}`)
    expect(detail.ok()).toBeTruthy()
    expect((await detail.json()).evaluation.roleKey).toBe('arquitecto-l1')
  })

  test('rechaza notas que no corresponden al rol', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)

    const response = await request.post('/api/ideal', {
      data: {
        evaluatedUserId: 3,
        roleKey: 'arquitecto-l1',
        evaluatedOn: '2026-09-11',
        // `sdlc` es de Desarrollador L3.
        scores: { ...ARQUITECTO_L1, sdlc: [3, 3, 3, 3, 3] },
      },
    })

    expect(response.status()).toBe(400)
    expect(await response.text()).not.toContain('sqlMessage')
  })

  test('un developer solo alcanza sus propias evaluaciones IDEAL', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const created = await request.post('/api/ideal', {
      data: {
        evaluatedUserId: 3,
        roleKey: 'arquitecto-l1',
        evaluatedOn: '2026-09-11',
        scores: ARQUITECTO_L1,
      },
    })
    const { id } = await created.json()

    // dev2 (id 4) no tiene nada que ver con esta evaluación, que es de dev (id 3).
    // 404 y no 403: un 403 confirmaría que existe.
    await apiLogin(request, ACCOUNTS.dev2)
    expect((await request.get(`/api/ideal/${id}`)).status()).toBe(404)

    const list = await request.get('/api/ideal')
    const { evaluations } = await list.json()
    expect(evaluations.every((item: { evaluatedUserId: number }) => item.evaluatedUserId === 4)).toBe(
      true,
    )
  })

  test('sin sesión no se puede crear ni listar', async ({ request }) => {
    const created = await request.post('/api/ideal', {
      data: { evaluatedUserId: 3, roleKey: 'arquitecto-l1', evaluatedOn: '2026-09-11', scores: {} },
    })
    expect(created.status()).toBe(401)
    expect((await request.get('/api/ideal')).status()).toBe(401)
  })
})
