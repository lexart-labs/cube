/**
 * Crear una evaluación IDEAL LEXART y redactarla con la IA.
 *
 * El orden importa: **primero se guarda, después se genera**. Si Gemini falla o
 * tarda, la evaluación queda registrada sin narrativa y la respuesta dice por
 * qué, con un botón para reintentar. Perder veinte notas rellenadas a mano por
 * un timeout de red sería el peor fallo posible de esta pantalla.
 *
 * Como en el resto de la API, el autor sale de la sesión y el promedio se
 * calcula aquí: lo que mande el cliente no decide la nota de nadie.
 */
import { defineEventHandler } from 'h3'
import { execute, queryOne } from '../../db'
import { validatedBody } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { badRequest, notFound } from '../../utils/errors'
import { sanitizeText } from '../../utils/sanitize'
import { audit } from '../../utils/audit'
import { enforceRateLimit } from '../../utils/ratelimit'
import { getRole, scorePercent, weightedAverage } from '../../../shared/ideal'
import { buildNarrative } from '../../utils/ideal-narrative'
import { idealBodySchema } from './_schema'

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, 'lead')
  const body = await validatedBody(event, idealBodySchema)

  const role = getRole(body.roleKey)!

  const evaluated = await queryOne<{ id: number; name: string }>(
    'SELECT id, name FROM users WHERE id = ? AND active = 1',
    [body.evaluatedUserId],
  )
  if (!evaluated) throw notFound('El colaborador indicado no existe')

  if (actor.id === body.evaluatedUserId) {
    throw badRequest('No puedes evaluarte a ti mismo')
  }

  const average = weightedAverage(body.roleKey, body.scores)
  const percent = scorePercent(average)
  const observations = sanitizeText(body.observations)

  const result = await execute(
    `INSERT INTO ideal_evaluations
       (author_user_id, evaluated_user_id, role_key, evaluated_on, scores,
        weighted_average, score_percent, observations, active)
     VALUES (?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, 1)`,
    [
      actor.id,
      body.evaluatedUserId,
      body.roleKey,
      body.evaluatedOn,
      JSON.stringify(body.scores),
      average,
      percent,
      observations,
    ],
  )

  await audit(event, {
    action: 'ideal.create',
    resource: 'ideal_evaluation',
    resourceId: result.insertId,
    metadata: { evaluatedUserId: body.evaluatedUserId, roleKey: body.roleKey },
  })

  // Cada generación cuesta dinero; un bucle en el cliente la multiplica.
  enforceRateLimit(`ideal-ai:user:${actor.id}`, { max: 30, windowMs: 60 * 60 * 1000 })

  const narrative = await buildNarrative({
    id: result.insertId,
    role,
    scores: body.scores,
    average,
    observations,
    name: evaluated.name,
  })

  return {
    id: result.insertId,
    weightedAverage: average,
    scorePercent: percent,
    ...narrative,
  }
})
