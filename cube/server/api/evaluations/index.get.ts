/**
 * Listado de evaluaciones.
 *
 * Mismo alcance que el modelo anterior: un developer ve exclusivamente las
 * suyas, y `evaluatedUserId` se ignora en su caso —no es un filtro, es el
 * límite de lo que puede alcanzar—.
 */
import { defineEventHandler } from 'h3'
import { query } from '../../db'
import { validatedQuery } from '../../utils/validation'
import { requireUser, canActOnOthers } from '../../utils/rbac'
import { evaluationListQuerySchema } from './_schema'

interface Row {
  id: number
  evaluated_user_id: number
  author_user_id: number | null
  active: number
  evaluated_name: string | null
  author_name: string | null
  role_key: string
  evaluated_on: string
  weighted_average: string | number
  score_percent: number
  generated_at: string | null
}

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const params = validatedQuery(event, evaluationListQuerySchema)

  const where: string[] = []
  const values: (string | number)[] = []

  /**
   * Las eliminadas solo las ve quien puede recuperarlas. A la persona evaluada
   * no le aparecen: si se eliminó una evaluación suya fue porque no debía
   * contar, y verla reaparecer en su historial sería peor que no verla.
   */
  if (!params.includeDeleted || !canActOnOthers(user)) {
    where.push('e.active = 1')
  }

  if (canActOnOthers(user)) {
    if (params.evaluatedUserId) {
      where.push('e.evaluated_user_id = ?')
      values.push(params.evaluatedUserId)
    }
  } else {
    where.push('e.evaluated_user_id = ?')
    values.push(user.id)
  }

  const offset = (params.page - 1) * params.pageSize

  const rows = await query<Row>(
    `SELECT e.id, e.evaluated_user_id, e.author_user_id, e.active,
            e.role_key, e.evaluated_on,
            e.weighted_average, e.score_percent, e.generated_at,
            evaluated.name AS evaluated_name,
            author.name AS author_name
       FROM evaluations e
       INNER JOIN users evaluated ON evaluated.id = e.evaluated_user_id
       LEFT JOIN users author ON author.id = e.author_user_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY e.evaluated_on DESC, e.id DESC
      LIMIT ? OFFSET ?`,
    [...values, params.pageSize, offset],
  )

  return {
    evaluations: rows.map((row) => ({
      id: row.id,
      evaluatedUserId: row.evaluated_user_id,
      // El cliente lo necesita para saber si puede editar: solo quien la hizo
      // —o un administrador— puede.
      authorUserId: row.author_user_id,
      active: row.active,
      evaluatedName: row.evaluated_name,
      authorName: row.author_name,
      roleKey: row.role_key,
      evaluatedOn: row.evaluated_on,
      weightedAverage: Number(row.weighted_average),
      scorePercent: row.score_percent,
      generatedAt: row.generated_at,
    })),
  }
})
