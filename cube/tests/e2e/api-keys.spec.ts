/**
 * API externa: claves, listas de acceso y alta de usuarios.
 *
 * Es el único sitio donde todo esto se ejecuta de verdad —esquema, middleware,
 * lista de acceso y endpoint— contra MySQL. Lo que se comprueba aquí es lo que
 * ningún unitario puede:
 *
 *   · una clave recién creada NO funciona, aunque el token sea correcto;
 *   · empieza a funcionar cuando se autoriza la IP, y no antes;
 *   · desactivarla la corta en la llamada siguiente, sin perderla de vista;
 *   · y los dos dominios de identidad no se tocan: la sesión no abre la API
 *     externa y la clave no abre la API interna.
 *
 * Nota sobre los dos clientes HTTP, que aquí importa más que de costumbre:
 * `page.request` comparte las cookies del navegador —es el cliente "con
 * sesión"— mientras que el fixture `request` está aislado y no lleva ninguna.
 * Justo lo que hace falta para probar que cada credencial abre solo su puerta.
 */
import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { ACCOUNTS, login } from './helpers'

/** Nombre único por ejecución: los E2E comparten base y se repiten. */
const RUN = Date.now()
const KEY_NAME = `E2E plataforma ${RUN}`

/** Las dos entradas que hacen falta para localhost: Node da una u otra. */
const LOCALHOST = [
  { kind: 'ip', pattern: '127.0.0.1', note: 'E2E' },
  { kind: 'ip', pattern: '::1', note: 'E2E' },
]

/** Crea una clave por la API de administración. `client` debe traer sesión. */
async function createKey(
  client: APIRequestContext,
  body: Record<string, unknown>,
): Promise<{ id: number; token: string }> {
  const response = await client.post('/api/api-keys', { data: body })
  expect(response.status(), await response.text()).toBe(201)
  return response.json()
}

test.describe('claves de API', () => {
  test('una clave nueva sin lista de acceso está bloqueada', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} sin lista`,
      scopes: ['users:create'],
    })

    // El token es correcto y la clave está activa. Aun así no entra: sin IP ni
    // dominio autorizados no se admite desde ningún sitio. Es el valor de
    // fábrica, y es lo que tiene que pasar.
    const response = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': token },
    })

    expect(response.status()).toBe(403)
    expect(await response.text()).toContain('IP')
  })

  test('autorizar localhost la desbloquea, y whoami dice qué se ve', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} localhost`,
      scopes: ['users:create'],
      allowlist: LOCALHOST,
    })

    const response = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': token },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.scopes).toEqual(['users:create'])
    // Lo que el servidor ve de verdad, que es exactamente lo que hay que
    // autorizar. Sin esto, configurar la lista es adivinar.
    expect(body.seenFrom.ip).toMatch(/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/)
    expect(body.token).toBeUndefined()
  })

  test('un token inventado o ausente responde 401, sin pistas', async ({ request }) => {
    const sinToken = await request.get('/api/external/v1/whoami')
    expect(sinToken.status()).toBe(401)

    const inventado = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': 'cube_000000000000_inventado' },
    })
    expect(inventado.status()).toBe(401)
    // A quien no ha demostrado tener una clave no se le cuenta nada: ni si el
    // prefijo existe, ni qué lista habría que tocar.
    expect(await inventado.text()).not.toContain('lista')
  })

  test('crea un usuario que aparece en la administración', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} alta`,
      scopes: ['users:create'],
      allowlist: LOCALHOST,
    })

    const email = `externo-${RUN}@cube.test`
    const created = await request.post('/api/external/v1/users', {
      headers: { 'X-API-Key': token },
      data: { name: 'Externa Alta', email, password: 'una-clave-larga-2026' },
    })

    expect(created.status()).toBe(200)
    const body = await created.json()
    expect(body.email).toBe(email)
    expect(body.id).toBeGreaterThan(0)

    // Reintentar no duplica: 409 con el id que ya existe.
    const repetido = await request.post('/api/external/v1/users', {
      headers: { 'X-API-Key': token },
      data: { name: 'Externa Alta', email, password: 'una-clave-larga-2026' },
    })
    expect(repetido.status()).toBe(409)

    // Y la persona está donde tiene que estar.
    const listado = await page.request.get('/api/users', { params: { search: email } })
    expect((await listado.json()).items).toHaveLength(1)
  })

  test('no puede crear administradores', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} sin admin`,
      scopes: ['users:create'],
      allowlist: LOCALHOST,
    })

    const response = await request.post('/api/external/v1/users', {
      headers: { 'X-API-Key': token },
      data: {
        name: 'Intento Admin',
        email: `admin-externo-${RUN}@cube.test`,
        password: 'una-clave-larga-2026',
        role: 'admin',
      },
    })

    // Una clave filtrada no puede regalarse la administración entera.
    expect(response.status()).toBe(400)
  })

  test('sin el permiso, la clave se autentica pero no crea nada', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} sin permisos`,
      scopes: [],
      allowlist: LOCALHOST,
    })

    const whoami = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': token },
    })
    expect(whoami.status()).toBe(200)

    const response = await request.post('/api/external/v1/users', {
      headers: { 'X-API-Key': token },
      data: {
        name: 'No Debería',
        email: `sin-permiso-${RUN}@cube.test`,
        password: 'una-clave-larga-2026',
      },
    })
    expect(response.status()).toBe(403)
  })
})

test.describe('los dos dominios de identidad no se tocan', () => {
  test('una sesión de Cube no abre la API externa', async ({ page }) => {
    await login(page, ACCOUNTS.admin)

    // `page.request` sí lleva la cookie de admin. La API externa no la mira:
    // exige clave, y no hay clave.
    const response = await page.request.get('/api/external/v1/whoami')
    expect(response.status()).toBe(401)
  })

  test('una clave de API no abre la API interna', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const { token } = await createKey(page.request, {
      name: `${KEY_NAME} interna`,
      scopes: ['users:create'],
      allowlist: LOCALHOST,
    })

    // Cliente sin cookies, solo con la clave: `/api/users` exige sesión y la
    // clave no cuenta como una.
    const response = await request.get('/api/users', { headers: { 'X-API-Key': token } })
    expect(response.status()).toBe(401)
  })
})

test.describe('administración de claves', () => {
  test('el token se muestra una sola vez al crearla', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/api-keys')

    await page.getByRole('button', { name: /nueva clave/i }).click()
    // Por el marcador de posición y no por la etiqueta: la etiqueta lleva
    // pegada la ayuda («Para quién es…»), así que su nombre accesible no es
    // solo "Nombre".
    await page.getByPlaceholder(/plataforma lexart/i).fill(`${KEY_NAME} interfaz`)
    await page.getByRole('button', { name: /añadir localhost/i }).click()
    await page.getByRole('button', { name: /^crear$/i }).click()

    // El token entero, no el `cube_<prefijo>_…` enmascarado que sale en la
    // tarjeta de cada clave: el patrón exige el secreto detrás del prefijo.
    const token = page.locator('code').filter({ hasText: /^cube_[0-9a-f]{12}_[\w-]{20,}$/ })
    await expect(token).toBeVisible()
    const value = (await token.textContent())!.trim()

    // Al recargar ya no está: el servidor solo guarda el hash.
    await page.reload()
    await expect(page.getByText(value, { exact: true })).toHaveCount(0)
  })

  test('desactivar pregunta, y lo desactivado se sigue viendo', async ({ page, request }) => {
    await login(page, ACCOUNTS.admin)

    const nombre = `${KEY_NAME} ciclo`
    const { token } = await createKey(page.request, {
      name: nombre,
      scopes: ['users:create'],
      allowlist: LOCALHOST,
    })

    await page.goto('/admin/api-keys')
    const row = page.getByRole('listitem').filter({ hasText: nombre })

    await row.getByRole('button', { name: /^desactivar$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(nombre)
    await dialog.getByRole('button', { name: /^desactivar$/i }).click()

    /**
     * Se espera a que la interfaz confirme el cambio antes de llamar, y luego
     * se llama UNA vez. Nada de `expect.poll` aquí: cada reintento fallido
     * cuenta en el límite de claves inválidas (10 en 15 minutos, con retroceso
     * exponencial), así que un sondeo acabaría midiendo el rate limiter en
     * lugar de la revocación.
     */
    const desactivada = page.getByRole('listitem').filter({ hasText: nombre })
    await expect(desactivada).toContainText(/desactivada/i)

    // Corta en la llamada siguiente: no hay token de larga vida que aguante
    // por su cuenta, que es lo que no podía hacerse con los JWT de v1.
    const revocada = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': token },
    })
    expect(revocada.status()).toBe(401)

    // Y sigue en la lista, marcada, para poder reactivarla. Reactivar no pregunta.
    await desactivada.getByRole('button', { name: /^activar$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(desactivada.getByRole('button', { name: /^desactivar$/i })).toBeVisible()

    const reactivada = await request.get('/api/external/v1/whoami', {
      headers: { 'X-API-Key': token },
    })
    expect(reactivada.status()).toBe(200)
  })

  test('solo admin llega a las claves', async ({ page }) => {
    await login(page, ACCOUNTS.lead)

    expect((await page.request.get('/api/api-keys')).status()).toBe(403)
    expect((await page.request.post('/api/api-keys', { data: { name: 'no' } })).status()).toBe(403)
  })

  test('el listado nunca devuelve el token', async ({ page }) => {
    await login(page, ACCOUNTS.admin)

    const response = await page.request.get('/api/api-keys')
    expect(response.ok()).toBe(true)
    const text = await response.text()

    // Ni el token ni su hash: solo el prefijo, que identifica sin servir.
    expect(text).not.toContain('token_hash')
    expect(text).not.toMatch(/cube_[0-9a-f]{12}_/)
  })
})
