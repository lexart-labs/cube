/**
 * Esquema del cuerpo de una evaluación.
 *
 * La validación no se limita a "números entre 1 y 5": comprueba que los bloques
 * sean EXACTAMENTE los del rol elegido y que cada uno traiga tantas notas como
 * preguntas tiene. Un bloque de más, uno de menos o una nota suelta cambiarían
 * el promedio ponderado sin que nadie se entere.
 *
 * El alta y la edición comparten esas reglas, así que los campos se declaran
 * una sola vez (`answersShape`) y cada esquema los usa como necesita. Con dos
 * copias, corregir una regla en una y olvidarla en la otra sería cuestión de
 * tiempo — y la que se olvidaría es la de editar, que se toca menos.
 */
import { z } from 'zod'
import { ROLE_KEYS, getRole, isValidScore } from '../../../shared/evaluation'

const answersShape = {
  roleKey: z.enum(ROLE_KEYS as [string, ...string[]]),
  evaluatedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'La fecha no es válida',
    }),
  /** Notas por bloque, en el orden de las preguntas del catálogo. */
  scores: z.record(z.string().trim().min(1).max(64), z.array(z.number()).max(50)),
  /**
   * Texto plano. Se sanea antes de guardar y se pseudonimiza antes de enviarlo
   * a la IA: es el campo por el que más PII se cuela.
   */
  observations: z.string().max(5000).optional(),
}

/** Comprueba que las notas encajan exactamente con los bloques del rol. */
function validateScores(
  body: { roleKey: string; scores: Record<string, number[]> },
  ctx: z.RefinementCtx,
): void {
  const role = getRole(body.roleKey)
  if (!role) return

  const expected = role.blocks.map((block) => block.key).sort()
  const received = Object.keys(body.scores).sort()

  if (expected.join('|') !== received.join('|')) {
    ctx.addIssue({
      code: 'custom',
      path: ['scores'],
      message: `Los bloques no corresponden al rol ${role.label}`,
    })
    return
  }

  for (const block of role.blocks) {
    const values = body.scores[block.key]!
    if (values.length !== block.questions.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['scores', block.key],
        message: `El bloque ${block.key} espera ${block.questions.length} notas y trae ${values.length}`,
      })
      continue
    }
    for (const [index, value] of values.entries()) {
      if (!isValidScore(value, block.scale)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scores', block.key, index],
          message:
            block.scale === 'languages'
              ? 'La nota de idiomas solo puede ser 1, 3 o 5'
              : 'Las notas van de 1 a 5',
        })
      }
    }
  }
}

export const evaluationBodySchema = z
  .object({ ...answersShape, evaluatedUserId: z.coerce.number().int().positive() })
  .superRefine(validateScores)

export type EvaluationBody = z.infer<typeof evaluationBodySchema>

/**
 * Cuerpo de la edición.
 *
 * Dos cosas distintas por la misma puerta, como en el resto de la API:
 * cambiar las respuestas, o eliminar/restaurar con `active`.
 *
 * `evaluatedUserId` NO está: cambiar a quién evalúa una evaluación no es
 * editarla, es otra evaluación. Y las respuestas viajan **enteras** —rol,
 * fecha y notas juntos— porque las tres se validan como un conjunto: unas
 * notas nuevas con el rol viejo darían un promedio que no corresponde a
 * ninguna de las dos cosas.
 */
export const evaluationPatchSchema = z
  .object({
    roleKey: answersShape.roleKey.optional(),
    evaluatedOn: answersShape.evaluatedOn.optional(),
    scores: answersShape.scores.optional(),
    observations: answersShape.observations,
    active: z.boolean().optional(),
  })
  .superRefine((body, ctx) => {
    /**
     * Las observaciones van por su cuenta: no entran en el promedio, así que
     * corregir una frase no obliga a reenviar las veinte notas. Rol, fecha y
     * notas sí viajan juntos, que es lo que se valida como conjunto.
     */
    const editsAnswers =
      body.roleKey !== undefined || body.evaluatedOn !== undefined || body.scores !== undefined

    if (!editsAnswers && body.observations === undefined && body.active === undefined) {
      ctx.addIssue({ code: 'custom', message: 'No hay nada que actualizar' })
      return
    }

    if (!editsAnswers) return

    if (body.roleKey === undefined || body.evaluatedOn === undefined || body.scores === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Para cambiar las respuestas hay que enviar roleKey, evaluatedOn y scores juntos',
      })
      return
    }

    validateScores({ roleKey: body.roleKey, scores: body.scores }, ctx)
  })

export type EvaluationPatch = z.infer<typeof evaluationPatchSchema>

/** Filtros del listado. */
export const evaluationListQuerySchema = z.object({
  evaluatedUserId: z.coerce.number().int().positive().optional(),
  /**
   * Incluir las eliminadas. Solo lo atiende el servidor para lead y admin: a
   * la persona evaluada, una evaluación eliminada no le aparece — si se borró
   * fue porque no debía contar.
   *
   * No se usa `z.coerce.boolean()`: convierte cualquier cadena no vacía en
   * true, así que `?includeDeleted=false` diría lo contrario de lo pedido.
   */
  includeDeleted: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
