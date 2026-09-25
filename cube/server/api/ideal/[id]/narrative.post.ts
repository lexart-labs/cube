/**
 * Reintentar la redacción de una evaluación ya guardada.
 *
 * Existe porque la generación puede fallar —red, cuota, clave sin configurar— y
 * la evaluación se guarda igualmente. Sin esto, el único remedio sería volver a
 * rellenar el formulario entero.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { queryOne } from '../../../db'
import { validatedParams } from '../../../utils/validation'
import { requireRole } from '../../../utils/rbac'
import { notFound, serviceUnavailable } from '../../../utils/errors'
import { audit } from '../../../utils/audit'
import { enforceRateLimit } from '../../../utils/ratelimit'
import { buildNarrative } from '../../../utils/ideal-narrative'
import { getRole, type IdealScores } from '../../../../shared/ideal'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

interface Row {
  id: number
  role_key: string
  scores: IdealScores | string
  weighted_average: string | number
  observations: string | null
  evaluated_name: string
}

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, 'lead')
  const { id } = validatedParams(event, paramsSchema)

  enforceRateLimit(`ideal-ai:user:${actor.id}`, { max: 30, windowMs: 60 * 60 * 1000 })

  const row = await queryOne<Row>(
    `SELECT e.id, e.role_key, e.scores, e.weighted_average, e.observations,
            evaluated.name AS evaluated_name
       FROM ideal_evaluations e
       INNER JOIN users evaluated ON evaluated.id = e.evaluated_user_id
      WHERE e.id = ? AND e.active = 1`,
    [id],
  )

  if (!row) throw notFound('La evaluación no existe')

  const role = getRole(row.role_key)
  if (!role) throw notFound('El rol de esta evaluación ya no existe en el catálogo')

  const result = await buildNarrative({
    id: row.id,
    role,
    scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores,
    average: Number(row.weighted_average),
    observations: row.observations,
    name: row.evaluated_name,
  })

  if (result.aiStatus === 'disabled') throw serviceUnavailable(result.aiMessage)

  await audit(event, {
    action: 'ideal.generate',
    resource: 'ideal_evaluation',
    resourceId: row.id,
    metadata: { status: result.aiStatus },
  })

  return result
})
