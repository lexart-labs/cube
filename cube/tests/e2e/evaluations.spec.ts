/**
 * Panel del desarrollador y alcance de lo que puede ver.
 *
 * El flujo de alta está en `evaluation-form.spec.ts`; aquí se
 * comprueba lo que ve la persona evaluada cuando entra, que es el criterio de
 * aceptación de la Fase 4 del Roadmap: "un desarrollador entra y ve sus
 * evaluaciones sin explicación previa".
 *
 * La semilla le deja a Dana tres evaluaciones (2025-Q1, 2025-Q3 y
 * 2026-Q1), así que hay línea de evolución además de la cifra grande.
 */
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { ACCOUNTS, apiLogin, login } from './helpers'

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
    await page
      .getByRole('button', { name: /ver como tabla/i })
      .first()
      .click()
    // Ningún valor queda accesible solo por el gráfico.
    await expect(page.getByRole('table').first()).toBeVisible()
  })

  test('un developer no ve las evaluaciones de otro', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)

    // La evaluación 4 de la semilla es de Bruno (usuario 4), no de Dana (usuario 3).
    const response = await request.get('/api/evaluations/4')
    expect(response.status()).toBe(404)

    // 404 y no 403: un 403 confirmaría que la evaluación existe.
    const body = await response.json()
    expect(JSON.stringify(body)).not.toContain('403')
  })

  test('forjar la cabecera user-id no amplía el alcance — CRIT-07', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)

    const forged = await request.get('/api/evaluations', { headers: { 'user-id': '4' } })
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

/**
 * Editar y eliminar una evaluación.
 *
 * Hasta ahora una evaluación era inmutable: una nota mal puesta solo se
 * arreglaba creando otra encima, y las dos seguían contando. Lo que se
 * comprueba aquí es que se puede corregir, que "eliminar" no borra nada de la
 * base (regla 9) y que solo puede hacerlo quien la hizo.
 *
 * Todas las evaluaciones que crean estos tests son de Bruno (usuario 4), no de
 * Dana: el panel de Dana lo comprueban los tests de arriba con las cifras de
 * la semilla, y moverlas sería romperlos desde aquí.
 */
test.describe('editar y eliminar', () => {
  const NOTAS_3 = { sdlc: [3, 3, 3], autonomia: [3, 3, 3], hardSkills: [3, 3, 3, 3], idiomas: [3] }

  /** Crea una evaluación de Bruno firmada por Luis y devuelve su id. */
  async function crearDeBruno(client: APIRequestContext, scores = NOTAS_3) {
    const response = await client.post('/api/evaluations', {
      data: {
        evaluatedUserId: 4,
        roleKey: 'desarrollador-l3',
        evaluatedOn: '2026-06-01',
        scores,
        observations: 'Creada por el test.',
      },
    })
    expect(response.status(), await response.text()).toBe(200)
    return (await response.json()).id as number
  }

  test('el autor corrige las notas y el promedio se recalcula', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)

    const id = await crearDeBruno(request)

    const detalle = await request.get(`/api/evaluations/${id}`)
    expect((await detalle.json()).evaluation.weightedAverage).toBe(3)

    // Todo a 5. La escala de idiomas es cerrada y el 5 es válido en ella.
    const edited = await request.patch(`/api/evaluations/${id}`, {
      data: {
        roleKey: 'desarrollador-l3',
        evaluatedOn: '2026-06-02',
        scores: { sdlc: [5, 5, 5], autonomia: [5, 5, 5], hardSkills: [5, 5, 5, 5], idiomas: [5] },
      },
    })
    expect(edited.status()).toBe(200)
    const body = await edited.json()
    // El promedio lo recalcula el servidor, no lo manda el cliente.
    expect(body.weightedAverage).toBe(5)
    expect(body.scorePercent).toBe(100)
    // Y avisa de que la redacción anterior ya no corresponde a estas notas.
    expect(body.narrativeCleared).toBe(true)

    const despues = await request.get(`/api/evaluations/${id}`)
    const guardada = (await despues.json()).evaluation
    expect(guardada.weightedAverage).toBe(5)
    expect(guardada.evaluatedOn).toContain('2026-06-02')
    expect(guardada.narrative).toBeNull()
  })

  test('las notas no se pueden cambiar sin el rol y la fecha', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    // Notas nuevas con el rol viejo darían un promedio que no corresponde a
    // ninguno de los dos: los tres campos viajan juntos o no viajan.
    const response = await request.patch(`/api/evaluations/${id}`, {
      data: {
        scores: { sdlc: [5, 5, 5], autonomia: [5, 5, 5], hardSkills: [5, 5, 5, 5], idiomas: [5] },
      },
    })
    expect(response.status()).toBe(400)
  })

  test('no se puede cambiar a quién evalúa', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    await request.patch(`/api/evaluations/${id}`, {
      data: {
        evaluatedUserId: 3,
        roleKey: 'desarrollador-l3',
        evaluatedOn: '2026-06-01',
        scores: NOTAS_3,
      },
    })

    // El campo se ignora: sigue siendo de Bruno.
    const detalle = await request.get(`/api/evaluations/${id}`)
    expect((await detalle.json()).evaluation.evaluatedUserId).toBe(4)
  })

  test('eliminar no borra: desaparece del listado y se recupera', async ({ page, request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    await login(page, ACCOUNTS.lead)
    await page.goto(`/evaluations/${id}`)

    // Eliminar SIEMPRE pregunta, y pregunta en un modal de la aplicación.
    await page.getByRole('button', { name: /^eliminar$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Bruno')
    await dialog.getByRole('button', { name: /^eliminar$/i }).click()

    // La fila sigue en la base, marcada.
    await expect(page.getByText(/eliminada/i).first()).toBeVisible()

    // En el listado no sale por defecto… Se localiza por su enlace y no por
    // el nombre: Bruno tiene varias evaluaciones y filtrar por texto cogería
    // cualquiera de ellas.
    const fila = page.getByRole('row').filter({ has: page.locator(`a[href="/evaluations/${id}"]`) })
    await page.goto('/evaluations')
    await expect(fila).toHaveCount(0)

    // …pero se puede pedir, que es lo que impide que eliminar sea perder.
    await page.getByLabel(/mostrar eliminadas/i).check()
    await expect(fila).toContainText(/eliminada/i)

    // Restaurar no pregunta: no quita nada de en medio.
    await fila.getByRole('button', { name: /^restaurar$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const restaurada = await request.get(`/api/evaluations/${id}`)
    expect((await restaurada.json()).evaluation.active).toBe(1)
  })

  test('una evaluación eliminada no le existe a la persona evaluada', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)
    expect(
      (await request.patch(`/api/evaluations/${id}`, { data: { active: false } })).status(),
    ).toBe(200)

    // Bruno no la ve ni de frente ni en su listado: si se eliminó fue porque
    // no debía contar, y verla reaparecer sería peor que no verla.
    await apiLogin(request, ACCOUNTS.dev2)
    expect((await request.get(`/api/evaluations/${id}`)).status()).toBe(404)

    const listado = await request.get('/api/evaluations', { params: { includeDeleted: 'true' } })
    const ids = (await listado.json()).evaluations.map((item: { id: number }) => item.id)
    expect(ids).not.toContain(id)
  })

  test('un developer no puede editar ni eliminar', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    await apiLogin(request, ACCOUNTS.dev)
    expect(
      (await request.patch(`/api/evaluations/${id}`, { data: { active: false } })).status(),
    ).toBe(403)
  })

  test('un lead no toca las evaluaciones de otro lead', async ({ page, request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    // Se crea un segundo lead: la semilla solo trae uno.
    await apiLogin(request, ACCOUNTS.admin)
    const otro = {
      email: `otro-lead-${Date.now()}@cube.test`,
      password: 'una-clave-larga-2026',
    }
    const creado = await request.post('/api/users', {
      data: { name: 'Otro Lead', email: otro.email, password: otro.password, role: 'lead' },
    })
    expect(creado.status()).toBe(200)

    await login(page, otro)
    // Ve la evaluación —un lead las ve todas— pero no puede cambiarla.
    expect((await page.request.get(`/api/evaluations/${id}`)).status()).toBe(200)

    const response = await page.request.patch(`/api/evaluations/${id}`, {
      data: { active: false },
    })
    // 403 y no 404: esconderla no protegería nada, porque ya la puede leer.
    expect(response.status()).toBe(403)
    expect(await response.text()).toContain('administrador')
  })

  test('un administrador sí puede editar la de otro', async ({ request }) => {
    await apiLogin(request, ACCOUNTS.lead)
    const id = await crearDeBruno(request)

    await apiLogin(request, ACCOUNTS.admin)
    const response = await request.patch(`/api/evaluations/${id}`, {
      data: { observations: 'Corregido por administración.' },
    })
    expect(response.status()).toBe(200)
    expect((await response.json()).narrativeCleared).toBe(true)
  })
})
