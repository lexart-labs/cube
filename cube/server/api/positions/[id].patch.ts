/**
 * Actualizar o desactivar una posición. Solo admin.
 *
 * Se desactiva, no se borra: hay usuarios y evaluaciones que la referencian, y
 * borrarla dejaría su historial sin contexto.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody, validatedParams, idParam } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound, conflict } from '../../utils/errors'
import { audit } from '../../utils/audit'

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(191).optional(),
    minimumTimeMonths: z.coerce.number().int().min(0).max(600).optional(),
    active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No hay nada que actualizar' })

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')
  const { id } = validatedParams(event, idParam)
  const body = await validatedBody(event, bodySchema)

  const existing = await queryOne<{ id: number }>('SELECT id FROM positions WHERE id = ?', [id])
  if (!existing) throw notFound('Posición no encontrada')

  // El nombre es UNIQUE en la tabla. Sin esta comprobación, renombrar a algo
  // que ya existe sale como un 500 genérico —el error del motor no cruza la
  // frontera (HIGH-07)— y quien lo intenta no sabe por qué ha fallado.
  if (body.name !== undefined) {
    const duplicate = await queryOne<{ id: number }>(
      'SELECT id FROM positions WHERE name = ? AND id <> ?',
      [body.name, id],
    )
    if (duplicate) throw conflict('Ya existe una posición con ese nombre')
  }

  const updates: string[] = []
  const values: (string | number)[] = []
  if (body.name !== undefined) {
    updates.push('name = ?')
    values.push(body.name)
  }
  if (body.minimumTimeMonths !== undefined) {
    updates.push('minimum_time_months = ?')
    values.push(body.minimumTimeMonths)
  }
  if (body.active !== undefined) {
    updates.push('active = ?')
    values.push(body.active ? 1 : 0)
  }

  values.push(id)
  await execute(`UPDATE positions SET ${updates.join(', ')} WHERE id = ?`, values)

  await audit(event, {
    action: 'catalog.update',
    resource: 'position',
    resourceId: id,
    metadata: { fields: Object.keys(body) },
  })
  return { id, updated: true }
})
