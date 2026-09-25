/**
 * Catálogo de posiciones. Cualquier usuario autenticado puede consultarlo.
 *
 * Por defecto solo las activas, que es lo que necesitan los formularios: nadie
 * debe poder asignar una posición retirada. La administración pide
 * `includeInactive=true` para poder ver también las desactivadas y reactivarlas
 * — si no se ven en ninguna parte, desactivar equivale a perderlas.
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
    `SELECT id, name, minimum_time_months, active
     FROM positions
     ${includeInactive ? '' : 'WHERE active = 1'}
     ORDER BY active DESC, name`,
  )
  return { items }
})
