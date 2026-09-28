/**
 * Comprobaciones de seguridad contra un servidor real.
 *
 * Son las de `Security.md` §9, que hasta ahora solo existían como comandos en
 * un documento. Cada una corresponde a un hallazgo concreto de v1.
 */
import { test, expect } from '@playwright/test'
import { ACCOUNTS, login } from './helpers'

test.describe('cabeceras — MED-03', () => {
  test('la respuesta trae CSP, HSTS y nosniff', async ({ request }) => {
    const response = await request.get('/login')
    const headers = response.headers()

    expect(headers['content-security-policy']).toBeTruthy()
    // Con nonce y strict-dynamic: sin allow-list de CDNs ni unsafe-inline.
    expect(headers['content-security-policy']).toContain("'strict-dynamic'")
    expect(headers['content-security-policy']).not.toContain("'unsafe-inline'")
    expect(headers['strict-transport-security']).toContain('max-age=31536000')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBeTruthy()
  })
})

test.describe('inyección SQL — CRIT-04', () => {
  test('la búsqueda no ejecuta lo que se le pase', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)

    // La misma carga que en v1 se concatenaba dentro del SQL.
    const response = await request.get('/api/users', {
      params: { search: "' OR 1=1 --" },
    })

    expect(response.ok()).toBe(true)
    const data = await response.json()
    // Trata la carga como texto de búsqueda: no encuentra nada.
    expect(data.items).toHaveLength(0)
  })

  test('la paginación rechaza valores no numéricos', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    const response = await request.get('/api/evaluations', { params: { page: '1; DROP TABLE users' } })
    expect(response.status()).toBe(400)
  })

  test('el orden solo acepta valores de la allow-list', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    const response = await request.get('/api/users', { params: { sort: 'name; DELETE' } })
    expect(response.status()).toBe(400)
  })
})

test.describe('control de acceso — HIGH-01, HIGH-02', () => {
  test('sin sesión, toda la API responde 401', async ({ request }) => {
    const paths = [
      '/api/evaluations',
      '/api/users',
      '/api/positions',
      '/api/levels',
      '/api/auth/me',
    ]
    for (const path of paths) {
      expect((await request.get(path)).status(), path).toBe(401)
    }
  })

  test('un developer no alcanza los endpoints de administración', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)

    expect((await request.get('/api/users')).status()).toBe(403)
    expect((await request.post('/api/evaluations', { data: {} })).status()).toBe(403)
  })

  test('un lead no puede crear usuarios', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    expect((await request.post('/api/users', { data: {} })).status()).toBe(403)
  })
})

test.describe('sesión — HIGH-03, MED-01', () => {
  test('la cookie de sesión es httpOnly y SameSite', async ({ page, context }) => {
    await login(page, ACCOUNTS.dev)
    const cookie = (await context.cookies()).find((c) => c.name === 'cube_session')

    expect(cookie).toBeTruthy()
    // Inaccesible desde JavaScript: un XSS no puede robarla.
    expect(cookie!.httpOnly).toBe(true)
    expect(cookie!.sameSite).toBe('Lax')
  })

  test('el token no está en localStorage', async ({ page }) => {
    await login(page, ACCOUNTS.dev)
    const stored = await page.evaluate(() => JSON.stringify(window.localStorage))
    expect(stored).not.toContain('token')
  })

  test('el logout revoca la sesión de inmediato', async ({ page, request }) => {
    await login(page, ACCOUNTS.dev)
    expect((await request.get('/api/auth/me')).ok()).toBe(true)

    await request.post('/api/auth/logout')

    // La misma cookie ya no vale: en v1 el JWT seguía siendo válido un año.
    expect((await request.get('/api/auth/me')).status()).toBe(401)
  })

  test('cambiar la contraseña cierra las sesiones abiertas', async ({ browser, request }) => {
    const victim = await browser.newContext()
    const victimPage = await victim.newPage()
    await login(victimPage, ACCOUNTS.dev2)

    const admin = await browser.newContext()
    const adminPage = await admin.newPage()
    await login(adminPage, ACCOUNTS.admin)

    await adminPage.request.patch('/api/users/4', {
      data: { password: 'una-contraseña-nueva-larga' },
    })

    // La sesión anterior queda revocada al instante.
    const response = await victimPage.request.get('/api/auth/me')
    expect(response.status()).toBe(401)

    await victim.close()
    await admin.close()
    void request
  })
})

test.describe('errores — HIGH-07', () => {
  test('un 404 no filtra detalles internos', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    const response = await request.get('/api/evaluations/999999')
    const body = await response.text()

    expect(response.status()).toBe(404)
    // Nada de nombres de tabla, SQL ni rutas del sistema de ficheros.
    expect(body).not.toMatch(/sqlMessage|ER_|SELECT |\/app\/|node_modules/i)
  })

  test('un cuerpo inválido devuelve un mensaje legible, no una traza', async ({ page, request }) => {
    await login(page, ACCOUNTS.lead)
    const response = await request.post('/api/evaluations', { data: { roleKey: '' } })

    expect(response.status()).toBe(400)
    const body = await response.text()
    expect(body).not.toContain('at ')
    expect(body).not.toContain('node:internal')
  })
})

test.describe('límite de intentos — MED-04', () => {
  test('el login se bloquea tras varios fallos', async ({ request }) => {
    let blocked = false

    for (let attempt = 0; attempt < 15; attempt++) {
      const response = await request.post('/api/auth/login', {
        data: { email: 'inexistente@cube.test', password: 'incorrecta-pero-larga' },
      })
      if (response.status() === 429) {
        blocked = true
        expect(await response.text()).toMatch(/segundos|seconds/i)
        break
      }
    }

    expect(blocked, 'el login debería bloquearse antes del intento 15').toBe(true)
  })
})

test.describe('enumeración de cuentas', () => {
  test('el mensaje no distingue email inexistente de contraseña incorrecta', async ({
    request,
  }) => {
    const unknown = await request.post('/api/auth/login', {
      data: { email: 'nadie@cube.test', password: 'incorrecta-pero-larga' },
    })
    const wrongPassword = await request.post('/api/auth/login', {
      data: { email: ACCOUNTS.dev.email, password: 'incorrecta-pero-larga' },
    })

    expect(unknown.status()).toBe(wrongPassword.status())
    expect(await unknown.text()).toBe(await wrongPassword.text())
  })
})
