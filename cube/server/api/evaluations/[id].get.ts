/**
 * Detalle de una evaluación.
 *
 * Un developer solo alcanza las suyas: la comprobación se hace sobre la fila
 * real, no sobre lo que diga la petición.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { queryOne } from '../../db'
import { validatedParams } from '../../utils/validation'
import { requireUser, canActOnOthers } from '../../utils/rbac'
import { notFound } from '../../utils/errors'
import { getRole, type EvaluationScores } from '../../../shared/evaluation'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

interface Row {
  id: number
  evaluated_user_id: number
  author_user_id: number | null
  active: number
  evaluated_name: string | null
  author_name: string | null
  role_key: string
  evaluated_on: string
  scores: EvaluationScores | string
  weighted_average: string | number
  score_percent: number
  observations: string | null
  narrative_es: string | null
  narrative_en: string | null
  ai_model: string | null
  generated_at: string | null
}

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const { id } = validatedParams(event, paramsSchema)

  const row = await queryOne<Row>(
    `SELECT e.id, e.evaluated_user_id, e.author_user_id, e.active,
            e.role_key, e.evaluated_on, e.scores,
            e.weighted_average, e.score_percent, e.observations,
            e.narrative_es, e.narrative_en, e.ai_model, e.generated_at,
            evaluated.name AS evaluated_name,
            author.name AS author_name
       FROM evaluations e
       INNER JOIN users evaluated ON evaluated.id = e.evaluated_user_id
       LEFT JOIN users author ON author.id = e.author_user_id
      WHERE e.id = ?`,
    [id],
  )

  // 404 y no 403 cuando no es suya: un 403 confirmaría que la evaluación
  // existe, que es la misma distinción que aplica el modelo anterior.
  if (!row) throw notFound('La evaluación no existe')
  if (!canActOnOthers(user) && row.evaluated_user_id !== user.id) {
    throw notFound('La evaluación no existe')
  }
  // Una eliminada solo existe para quien puede restaurarla. Para la persona
  // evaluada es como si no estuviera, igual que en el listado.
  if (row.active !== 1 && !canActOnOthers(user)) {
    throw notFound('La evaluación no existe')
  }

  return {
    evaluation: {
      id: row.id,
      evaluatedUserId: row.evaluated_user_id,
      authorUserId: row.author_user_id,
      active: row.active,
      evaluatedName: row.evaluated_name,
      authorName: row.author_name,
      roleKey: row.role_key,
      roleLabel: getRole(row.role_key)?.label ?? row.role_key,
      evaluatedOn: row.evaluated_on,
      scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores,
      weightedAverage: Number(row.weighted_average),
      scorePercent: row.score_percent,
      observations: row.observations,
      narrative:
        row.narrative_es && row.narrative_en
          ? { es: row.narrative_es, en: row.narrative_en }
          : null,
      aiModel: row.ai_model,
      generatedAt: row.generated_at,
    },
  }
})
