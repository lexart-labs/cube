/**
 * La barra de navegación y la sesión al recargar.
 *
 * Estos tests existen por dos fallos que no detectó nada más: `app.vue` pintaba
 * `<NuxtPage/>` sin `<NuxtLayout/>` —y entonces Nuxt no aplica ningún layout—,
 * así que no había ni menú ni márgenes en ninguna pantalla; y en SSR `$fetch`
 * no reenviaba la cookie de sesión, con lo que recargar devolvía al login.
 *
 * Ambos son invisibles para los unitarios y para la API: hace falta un
 * navegador pidiendo la página entera.
 */
import { test, expect } from '@playwright/test'
import { ACCOUNTS, login } from './helpers'

test.describe('barra de navegación', () => {
  test('un admin llega a las cinco secciones de Cube', async ({ page }) => {
    await login(page, ACCOUNTS.admin)

    const nav = page.getByRole('navigation', { name: /principal/i }).first()
    for (const label of ['Mi panel', 'Evaluaciones', 'Usuarios', 'Catálogos']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('un developer solo ve su panel', async ({ page }) => {
    await login(page, ACCOUNTS.dev)

    const nav = page.getByRole('navigation', { name: /principal/i }).first()
    await expect(nav.getByRole('link', { name: 'Mi panel', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Catálogos', exact: true })).toHaveCount(0)
  })

  test('el contenido no queda pegado al borde de la ventana', async ({ page }) => {
    await login(page, ACCOUNTS.dev)

    const box = await page.getByRole('heading', { level: 1 }).first().boundingBox()
    expect(box).not.toBeNull()
    // Sin layout, el título arrancaba en x = 0.
    expect(box!.x).toBeGreaterThanOrEqual(16)
  })
})

test.describe('la sesión sobrevive a una recarga', () => {
  test('recargar una página protegida no devuelve al login', async ({ page }) => {
    await login(page, ACCOUNTS.admin)

    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/admin\/users/)

    // Es el render en servidor el que tiene que reconocer la cookie.
    await page.reload()
    await expect(page).toHaveURL(/\/admin\/users/)

    const nav = page.getByRole('navigation', { name: /principal/i }).first()
    await expect(nav.getByRole('link', { name: 'Usuarios', exact: true })).toBeVisible()
  })

  test('el login y la extranet siguen sin la barra de Cube', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('navigation', { name: /principal/i })).toHaveCount(0)
  })
})
