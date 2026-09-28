/**
 * Editar una evaluación, o eliminarla y restaurarla.
 *
 * Hasta ahora una evaluación era inmutable: una nota mal puesta o una fecha
 * equivocada solo se arreglaban creando otra encima, y las dos quedaban
 * contando en el panel de la persona.
 *
 * Dos decisiones que sostienen el resto del fichero:
 *
 * · **Eliminar es desactivar** (regla 9). La fila no se borra: deja de contar
 *   en el panel y en el historial, y se puede recuperar desde el listado. Una
 *   evaluación borrada de verdad se llevaría por delante el histórico de
 *   alguien sin que quedara rastro de que existió.
 *
 * · **Cambiar las respuestas invalida la redacción.** Si las notas cambian, el
 *   párrafo que escribió la IA describe otra evaluación, así que se borra y
 *   hay que volver a generarlo con el botón de siempre. No se regenera aquí:
 *   la IA tarda y puede fallar, y guardar el cambio no puede depender de eso
 *   — es la misma razón por la que el alta guarda primero y redacta después.
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { execute, queryOne } from '../../db'
import { validatedBody, validatedParams } from '../../utils/validation'
import { requireRole } from '../../utils/rbac'
import { notFound, forbidden } from '../../utils/errors'
import { sanitizeText } from '../../utils/sanitize'
import { audit } from '../../utils/audit'
import { scorePercent, weightedAverage } from '../../../shared/evaluation'
import { evaluationPatchSchema } from './_schema'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

export default defineEventHandler(async (event) => {
  const actor = requireRole(event, 'lead')
  const { id } = validatedParams(event, paramsSchema)
  const body = await validatedBody(event, evaluationPatchSchema)

  // Se lee también la inactiva: restaurarla es precisamente lo que hace falta
  // poder hacer con una eliminada.
  const row = await queryOne<{
    id: number
    author_user_id: number | null
    evaluated_user_id: number
    active: number
  }>('SELECT id, author_user_id, evaluated_user_id, active FROM evaluations WHERE id = ?', [id])
  if (!row) throw notFound('La evaluación no existe')

  /**
   * Quien la hizo, o un administrador. Un lead ve todas las evaluaciones, así
   * que aquí sí es un 403 y no un 404: esconderla no protegería nada y dejaría
   * a quien lo intenta sin saber por qué no puede.
   */
  if (actor.role !== 'admin' && row.author_user_id !== actor.id) {
    throw forbidden('Solo quien hizo la evaluación o un administrador pueden cambiarla')
  }

  const updates: string[] = []
  const values: (string | number | null)[] = []
  const push = (column: string, value: string | number | null) => {
    updates.push(`${column} = ?`)
    values.push(value)
  }

  let average: number | null = null
  let percent: number | null = null

  const editsAnswers = body.scores !== undefined

  if (editsAnswers) {
    // El esquema garantiza que los tres vienen juntos cuando se tocan.
    const roleKey = body.roleKey!
    const scores = body.scores!

    average = weightedAverage(roleKey, scores)
    percent = scorePercent(average)

    push('role_key', roleKey)
    push('evaluated_on', body.evaluatedOn!)
    // El promedio lo calcula el servidor con la misma función que el alta: lo
    // que mande el cliente no decide la nota de nadie.
    push('weighted_average', average)
    push('score_percent', percent)
    push('observations', sanitizeText(body.observations))

    // `CAST(? AS JSON)` como en el alta, para que la columna reciba JSON y no
    // una cadena que luego haya que adivinar al leer.
    updates.push('scores = CAST(? AS JSON)')
    values.push(JSON.stringify(scores))

    // La redacción describía las notas anteriores.
    updates.push('narrative_es = NULL', 'narrative_en = NULL')
    updates.push('ai_model = NULL', 'generated_at = NULL')
  } else if (body.observations !== undefined) {
    // Cambiar solo las observaciones no mueve el promedio, pero sí el texto
    // que se le pasó a la IA: la redacción también deja de corresponder.
    push('observations', sanitizeText(body.observations))
    updates.push('narrative_es = NULL', 'narrative_en = NULL')
    updates.push('ai_model = NULL', 'generated_at = NULL')
  }

  if (body.active !== undefined) push('active', body.active ? 1 : 0)

  values.push(id)
  await execute(`UPDATE evaluations SET ${updates.join(', ')} WHERE id = ?`, values)

  if (body.active !== undefined && !editsAnswers) {
    await audit(event, {
      action: body.active ? 'evaluation.restore' : 'evaluation.delete',
      resource: 'evaluation',
      resourceId: id,
      metadata: { evaluatedUserId: row.evaluated_user_id },
    })
  } else {
    await audit(event, {
      action: 'evaluation.update',
      resource: 'evaluation',
      resourceId: id,
      metadata: {
        evaluatedUserId: row.evaluated_user_id,
        fields: Object.keys(body),
        weightedAverage: average,
      },
    })
  }

  return {
    id,
    updated: true,
    active: body.active ?? row.active === 1,
    weightedAverage: average,
    scorePercent: percent,
    /** Avisa a la interfaz de que hay que volver a generar la redacción. */
    narrativeCleared: editsAnswers || body.observations !== undefined,
  }
})
