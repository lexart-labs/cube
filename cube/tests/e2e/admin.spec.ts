/**
 * Administración: desactivar cosas sin perderlas de vista.
 *
 * Dos reglas que este flujo tiene que cumplir y que antes no cumplía:
 *
 *   1. Desactivar SIEMPRE pregunta, y pregunta en un modal de la aplicación.
 *      Con `confirm()` del navegador el texto no se traducía y, tras varios
 *      avisos seguidos, el navegador ofrece silenciar los siguientes.
 *   2. Lo desactivado se sigue pudiendo ver. Las listas son de activos —lo que
 *      se desactiva sale de en medio, que es de lo que se trata— pero una
 *      casilla los trae de vuelta marcados y con su acción de reactivar. Antes,
 *      `/api/positions` y `/api/levels` solo devolvían lo activo y no había
 *      casilla ninguna: desactivar un nivel era perderlo.
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
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^desactivar$/i })
      .click()

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
      page
        .getByRole('listitem')
        .filter({ hasText: 'Semi Senior' })
        .getByRole('button', { name: /^desactivar$/i }),
    ).toBeVisible()
  })
})

test.describe('usuarios', () => {
  test('el desactivado sale del listado y vuelve al mostrar los desactivados', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const bruno = () => page.getByRole('row').filter({ hasText: 'dev2@cube.test' })
    await bruno()
      .getByRole('button', { name: /^desactivar$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Bruno')
    await dialog.getByRole('button', { name: /^desactivar$/i }).click()

    // Cerrar sus sesiones es parte de desactivar, y se dice.
    await expect(page.getByRole('status')).toBeVisible()

    // El listado es de activos: la fila se va. Antes se quedaba, y la única
    // señal de que algo había pasado era la palabra "Inactivo" en su columna.
    await expect(bruno()).toHaveCount(0)

    // No se ha perdido (regla 9): la casilla lo devuelve, marcado como
    // inactivo y junto a los que siguen activos.
    await page.getByLabel(/mostrar desactivados/i).check()
    await expect(bruno()).toContainText(/inactivo/i)
    await expect(page.getByRole('row').filter({ hasText: 'dev@cube.test' })).toBeVisible()

    // Y desde ahí se reactiva. Se deja como estaba, que los tests comparten base.
    await bruno()
      .getByRole('button', { name: /^activar$/i })
      .click()
    await expect(bruno().getByRole('button', { name: /^desactivar$/i })).toBeVisible()
  })
})

/**
 * CRUD completo de usuarios y catálogos.
 *
 * Hasta ahora la administración solo sabía crear y desactivar: del usuario
 * únicamente se podía tocar el rol —con un `<select>` suelto en la tabla que
 * guardaba al soltarlo— y de una posición o un nivel, nada en absoluto. Una
 * errata en un nombre era para siempre. Estos tests cubren lo que se puede
 * cambiar ahora y, sobre todo, lo que el servidor sigue sin dejar cambiar.
 */

/** Sufijo único por ejecución: los E2E comparten base y se repiten. */
const RUN = Date.now()

test.describe('usuarios — alta y edición', () => {
  test('se crea con posición, nivel y lead, y luego se edita entero', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const email = `crud-${RUN}@cube.test`
    await page.getByRole('button', { name: /nuevo usuario/i }).click()

    const create = page.locator('form').filter({ hasText: 'Nuevo usuario' })
    await create.getByLabel(/^nombre$/i).fill('Carla CRUD')
    await create.getByLabel(/^email$/i).fill(email)
    await create.getByLabel(/contraseña inicial/i).fill('una-clave-larga-2026')
    // Los tres desplegables que antes no existían en el alta: había que crear
    // la cuenta y luego no había forma de asignarlos desde ninguna pantalla.
    await create.getByLabel(/^posición$/i).selectOption({ label: 'Tech Lead' })
    await create.getByLabel(/^nivel$/i).selectOption({ label: 'Senior' })
    await create.getByLabel(/^lead/i).selectOption({ label: 'Luis Lead' })
    await create.getByRole('button', { name: /^crear$/i }).click()

    const row = page.getByRole('row').filter({ hasText: email })
    await expect(row).toContainText('Carla CRUD')
    await expect(row).toContainText('Tech Lead')
    await expect(row).toContainText('Luis Lead')

    // --- edición ---
    await row.getByRole('button', { name: /^editar$/i }).click()
    const edit = page.locator('form').filter({ hasText: /Editando a/ })
    await expect(edit).toContainText('Carla CRUD')

    const newEmail = `crud-editada-${RUN}@cube.test`
    await edit.getByLabel(/^nombre$/i).fill('Carla Editada')
    await edit.getByLabel(/^email/i).fill(newEmail)
    await edit.getByLabel(/^rol$/i).selectOption('lead')
    await edit.getByLabel(/^nivel$/i).selectOption({ label: 'Junior' })
    // Quitar el lead es un valor legítimo, no un campo sin rellenar.
    await edit.getByLabel(/^lead$/i).selectOption({ label: 'Sin asignar' })
    await edit.getByRole('button', { name: /^guardar$/i }).click()

    const edited = page.getByRole('row').filter({ hasText: newEmail })
    await expect(edited).toContainText('Carla Editada')
    await expect(edited).toContainText(/lead/i)
    await expect(edited).toContainText('Junior')
    // El lead quitado deja la celda vacía, no el nombre anterior.
    await expect(edited).not.toContainText('Luis Lead')
  })

  test('cambiar la contraseña desde la edición cierra las sesiones', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const email = `crud-clave-${RUN}@cube.test`
    await page.getByRole('button', { name: /nuevo usuario/i }).click()
    const create = page.locator('form').filter({ hasText: 'Nuevo usuario' })
    await create.getByLabel(/^nombre$/i).fill('Pablo Clave')
    await create.getByLabel(/^email$/i).fill(email)
    await create.getByLabel(/contraseña inicial/i).fill('una-clave-larga-2026')
    await create.getByRole('button', { name: /^crear$/i }).click()

    const row = page.getByRole('row').filter({ hasText: email })
    await row.getByRole('button', { name: /^editar$/i }).click()

    const edit = page.locator('form').filter({ hasText: /Editando a/ })
    // En blanco significa "no la toques"; con valor, se cambia y se avisa.
    await edit.getByLabel(/nueva contraseña/i).fill('otra-clave-larga-2026')
    await edit.getByRole('button', { name: /^guardar$/i }).click()

    await expect(page.getByRole('status')).toContainText(/sesiones cerradas/i)
  })

  test('un email repetido se rechaza con un mensaje, no con un 500', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const row = page.getByRole('row').filter({ hasText: 'dev@cube.test' })
    await row.getByRole('button', { name: /^editar$/i }).click()

    const edit = page.locator('form').filter({ hasText: /Editando a/ })
    await edit.getByLabel(/^email/i).fill(ACCOUNTS.lead.email)
    await edit.getByRole('button', { name: /^guardar$/i }).click()

    // 409 con texto, no el 500 genérico que devolvería la clave UNIQUE.
    await expect(edit.getByRole('alert')).toContainText(/ya existe/i)

    // No se ha guardado nada: la fila conserva su email.
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: 'dev@cube.test' })).toBeVisible()
  })

  test('no se puede degradar a un lead que tiene gente a cargo', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    // Luis es lead de Dana y de Bruno en la semilla. Quitarle el rol dejaría a
    // los dos apuntando a alguien que ya no puede ser lead.
    const row = page.getByRole('row').filter({ hasText: 'lead@cube.test' })
    await row.getByRole('button', { name: /^editar$/i }).click()

    const edit = page.locator('form').filter({ hasText: /Editando a/ })
    await edit.getByLabel(/^rol$/i).selectOption('developer')
    await edit.getByRole('button', { name: /^guardar$/i }).click()

    // El mensaje dice a quién hay que reasignar, no solo que no se puede.
    const alert = edit.getByRole('alert')
    await expect(alert).toContainText(/reportan/i)
    await expect(alert).toContainText(/Dana|Bruno/)
  })

  test('un admin no puede cambiarse el rol a sí mismo', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/users')

    const row = page.getByRole('row').filter({ hasText: ACCOUNTS.admin.email })
    await row.getByRole('button', { name: /^editar$/i }).click()

    // El servidor lo rechaza; la interfaz además no ofrece el control, para no
    // hacer creer que es posible.
    const edit = page.locator('form').filter({ hasText: /Editando a/ })
    await expect(edit.getByLabel(/^rol$/i)).toBeDisabled()
  })

  test('la cadena de mando no admite bucles', async ({ page }) => {
    await login(page, ACCOUNTS.admin)

    // Dos leads, uno colgando del otro. Se crean por API porque lo que se
    // prueba es la regla del servidor, no el formulario.
    const jefa = await page.request.post('/api/users', {
      data: {
        name: 'Jefa Ciclo',
        email: `ciclo-jefa-${RUN}@cube.test`,
        password: 'una-clave-larga-2026',
        role: 'lead',
      },
    })
    expect(jefa.status()).toBe(200)
    const jefaId = (await jefa.json()).id

    const media = await page.request.post('/api/users', {
      data: {
        name: 'Media Ciclo',
        email: `ciclo-media-${RUN}@cube.test`,
        password: 'una-clave-larga-2026',
        role: 'lead',
        leadId: jefaId,
      },
    })
    expect(media.status()).toBe(200)
    const mediaId = (await media.json()).id

    // Cerrar el triángulo: la jefa pasaría a reportar a quien le reporta.
    const cycle = await page.request.patch(`/api/users/${jefaId}`, {
      data: { leadId: mediaId },
    })
    expect(cycle.status()).toBe(400)
    expect(await cycle.text()).toContain('bucle')

    // Y tampoco valen los bucles de uno solo.
    const self = await page.request.patch(`/api/users/${jefaId}`, { data: { leadId: jefaId } })
    expect(self.status()).toBe(400)
  })
})

test.describe('catálogos — edición', () => {
  test('una posición se renombra y se le corrigen los meses', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/catalogs')

    const original = `QA Enginer ${RUN}` // con la errata a propósito
    const corregido = `QA Engineer ${RUN}`

    const positions = page.locator('section').filter({ hasText: 'Posiciones' })
    await positions.getByPlaceholder(/nombre de la posición/i).fill(original)
    await positions.getByPlaceholder(/meses mínimos/i).fill('6')
    await positions.getByRole('button', { name: /^crear$/i }).click()

    const row = page.getByRole('listitem').filter({ hasText: original })
    await expect(row).toContainText('6')

    // Antes esto no se podía: la única salida era crear otra y desactivar la
    // mala, dejando a la gente repartida entre las dos.
    await row.getByRole('button', { name: /^editar$/i }).click()
    await row.getByRole('textbox').fill(corregido)
    await row.getByRole('spinbutton').fill('12')
    await row.getByRole('button', { name: /^guardar$/i }).click()

    const fixed = page.getByRole('listitem').filter({ hasText: corregido })
    await expect(fixed).toContainText('12')
    await expect(page.getByRole('listitem').filter({ hasText: original })).toHaveCount(0)

    // Se deja desactivada para no ensuciar los desplegables del resto.
    await fixed.getByRole('button', { name: /^desactivar$/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^desactivar$/i })
      .click()
  })

  test('renombrar a un nombre que ya existe se rechaza con un mensaje', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/catalogs')

    const levels = page.locator('section').filter({ hasText: 'Niveles' })
    const row = levels.getByRole('listitem').filter({ hasText: 'Junior' })

    await row.getByRole('button', { name: /^editar$/i }).click()
    await row.getByRole('textbox').fill('Senior')
    await row.getByRole('button', { name: /^guardar$/i }).click()

    // 409 con texto, no el 500 genérico de la clave UNIQUE.
    await expect(page.getByRole('alert')).toContainText(/ya existe/i)

    // Y Junior sigue llamándose Junior.
    await page.reload()
    await expect(levels.getByRole('listitem').filter({ hasText: 'Junior' })).toBeVisible()
  })

  test('cancelar la edición no cambia nada', async ({ page }) => {
    await login(page, ACCOUNTS.admin)
    await page.goto('/admin/catalogs')

    const levels = page.locator('section').filter({ hasText: 'Niveles' })
    // 'Semi Senior' y no 'Senior': el segundo también casaría con el primero.
    const row = levels.getByRole('listitem').filter({ hasText: 'Semi Senior' })

    await row.getByRole('button', { name: /^editar$/i }).click()
    await row.getByRole('textbox').fill('Nombre que no se guarda')
    await row.getByRole('button', { name: /^cancelar$/i }).click()

    await expect(levels.getByRole('listitem').filter({ hasText: 'Semi Senior' })).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Nombre que no se guarda' }),
    ).toHaveCount(0)
  })
})
