/**
 * Esquema del cuerpo de una evaluación IDEAL.
 *
 * La validación no se limita a "números entre 1 y 5": comprueba que los bloques
 * sean EXACTAMENTE los del rol elegido y que cada uno traiga tantas notas como
 * preguntas tiene. Un bloque de más, uno de menos o una nota suelta cambiarían
 * el promedio ponderado sin que nadie se entere.
 */
import { z } from 'zod'
import { IDEAL_ROLE_KEYS, getRole, isValidScore } from '../../../shared/ideal'

export const idealBodySchema = z
  .object({
    evaluatedUserId: z.coerce.number().int().positive(),
    roleKey: z.enum(IDEAL_ROLE_KEYS as [string, ...string[]]),
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
  })
  .superRefine((body, ctx) => {
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
  })

export type IdealBody = z.infer<typeof idealBodySchema>

/** Filtros del listado. Mismo patrón que el de evaluaciones. */
export const idealListQuerySchema = z.object({
  evaluatedUserId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
