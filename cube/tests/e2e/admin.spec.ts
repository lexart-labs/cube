/**
 * Administración: desactivar cosas sin perderlas de vista.
 *
 * Dos reglas que este flujo tiene que cumplir y que antes no cumplía:
 *
 *   1. Desactivar SIEMPRE pregunta, y pregunta en un modal de la aplicación.
 *      Con `confirm()` del navegador el texto no se traducía y, tras varios
 *      avisos seguidos, el navegador ofrece silenciar los siguientes.
 *   2. Lo desactivado se sigue viendo. Antes, `/api/positions` y `/api/levels`
 *      solo devolvían lo activo: desactivar un nivel era perderlo, porque no
 *      quedaba ninguna pantalla desde la que volver a activarlo.
 */
import { test, expect } from '@playwright/test'
import { ACCOUNTS, login } from './helpers'

test.describe('catálogos', () => {
  test('desactivar pregunta, y cancelar no cambia nada', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/catalogs')

    const row = page.getByRole('listitem').filter({ hasText: 'Semi Senior' })
    await row.getByRole('button', { name: /^desactivar$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Semi Senior')

    await dialog.getByRole('button', { name: /^cancelar$/i }).click()
    await expect(dialog).toBeHidden()

    // Sigue activo: la fila conserva la acción de desactivar.
    await expect(row.getByRole('button', { name: /^desactivar$/i })).toBeVisible()
  })

  test('lo desactivado se sigue viendo y se puede reactivar', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/catalogs')

    const row = page.getByRole('listitem').filter({ hasText: 'Semi Senior' })
    await row.getByRole('button', { name: /^desactivar$/i }).click()
    await page.getByRole('dialog').getByRole('button', { name: /^desactivar$/i }).click()

    // Por defecto solo se listan los activos: desaparece.
    await expect(page.getByRole('listitem').filter({ hasText: 'Semi Senior' })).toHaveCount(0)

    // Pero está, marcado como inactivo, y se puede volver a activar.
    await page.getByLabel(/mostrar desactivados/i).check()
    const inactive = page.getByRole('listitem').filter({ hasText: 'Semi Senior' })
    await expect(inactive).toContainText(/inactivo/i)

    // Reactivar no pregunta: no es una acción destructiva.
    await inactive.getByRole('button', { name: /^activar$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Semi Senior' }).getByRole('button', { name: /^desactivar$/i }),
    ).toBeVisible()
  })
})

test.describe('usuarios', () => {
  test('el estado se puede filtrar y el desactivado sigue apareciendo', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const row = page.getByRole('row').filter({ hasText: 'dev2@cube.test' })
    await row.getByRole('button', { name: /^desactivar$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Bruno')
    await dialog.getByRole('button', { name: /^desactivar$/i }).click()

    // Cerrar sus sesiones es parte de desactivar, y se dice.
    await expect(page.getByRole('status')).toBeVisible()

    // Sin filtro se listan todos: sigue ahí, marcado como inactivo.
    await expect(row).toContainText(/inactivo/i)

    // Y el filtro de estado lo encuentra.
    await page.getByLabel(/^estado$/i).selectOption('false')
    await expect(page.getByRole('row').filter({ hasText: 'dev2@cube.test' })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: /^Dana/ })).toHaveCount(0)

    // Se deja como estaba, que los tests comparten base.
    await page
      .getByRole('row')
      .filter({ hasText: 'dev2@cube.test' })
      .getByRole('button', { name: /^activar$/i })
      .click()
  })
})
