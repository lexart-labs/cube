/**
 * Catálogo de niveles. Cualquier usuario autenticado puede consultarlo.
 *
 * Mismo criterio que las posiciones: por defecto solo los activos, y
 * `includeInactive=true` para la pantalla de administración.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { query } from '../../db'
import { validatedQuery } from '../../utils/validation'
import { requireUser } from '../../utils/rbac'

const querySchema = z.object({
  /**
   * `z.coerce.boolean()` no sirve aquí: convierte CUALQUIER cadena no vacía en
   * true, así que `?includeInactive=false` diría justo lo contrario. Se compara
   * el texto.
   */
  includeInactive: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

export default defineEventHandler(async (event) => {
  requireUser(event)
  const { includeInactive } = validatedQuery(event, querySchema)

  const items = await query(
    `SELECT id, name, active
     FROM levels
     ${includeInactive ? '' : 'WHERE active = 1'}
     ORDER BY active DESC, name`,
  )
  return { items }
})
