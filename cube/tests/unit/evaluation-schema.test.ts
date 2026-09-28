/**
 * Validación del cuerpo de una evaluación.
 *
 * No basta con "números entre 1 y 5": si los bloques no son exactamente los del
 * rol, el promedio ponderado sale de otra fórmula sin que nadie se entere. Eso
 * es lo que se prueba aquí.
 */
import { describe, it, expect } from 'vitest'
import {
  evaluationBodySchema,
  evaluationListQuerySchema,
  evaluationPatchSchema,
} from '../../server/api/evaluations/_schema'
import { getRole } from '../../shared/evaluation'

function validBody(roleKey = 'arquitecto-l1') {
  const role = getRole(roleKey)!
  return {
    evaluatedUserId: 3,
    roleKey,
    evaluatedOn: '2026-09-11',
    scores: Object.fromEntries(role.blocks.map((b) => [b.key, b.questions.map(() => 3)])),
    observations: 'Buen semestre.',
  }
}

describe('cuerpo de la evaluación', () => {
  it('acepta un cuerpo completo', () => {
    expect(evaluationBodySchema.safeParse(validBody()).success).toBe(true)
  })

  it('acepta los cuatro roles del catálogo', () => {
    for (const roleKey of ['arquitecto-l1', 'arquitecto-l2', 'arquitecto-l3', 'desarrollador-l3']) {
      expect(evaluationBodySchema.safeParse(validBody(roleKey)).success).toBe(true)
    }
  })

  it('rechaza un rol que no existe', () => {
    const result = evaluationBodySchema.safeParse({ ...validBody(), roleKey: 'director-general' })
    expect(result.success).toBe(false)
  })

  it('rechaza bloques que no son los del rol', () => {
    const body = validBody('arquitecto-l1')
    // `sdlc` es de Desarrollador L3, no de Arquitecto L1.
    const scores = { ...body.scores, sdlc: [3, 3, 3, 3, 3] }
    const result = evaluationBodySchema.safeParse({ ...body, scores })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('no corresponden al rol')
  })

  it('rechaza que falte un bloque', () => {
    const body = validBody()
    const scores = { ...body.scores }
    delete (scores as Record<string, unknown>).comercial
    expect(evaluationBodySchema.safeParse({ ...body, scores }).success).toBe(false)
  })

  it('rechaza un bloque con menos notas que preguntas', () => {
    const body = validBody()
    const scores = { ...body.scores, hardSkills: [3, 3] }
    const result = evaluationBodySchema.safeParse({ ...body, scores })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('espera 5 notas')
  })

  it('rechaza notas fuera de 1-5', () => {
    for (const bad of [0, 6, -1, 2.5]) {
      const body = validBody()
      const scores = { ...body.scores, hardSkills: [bad, 3, 3, 3, 3] }
      expect(evaluationBodySchema.safeParse({ ...body, scores }).success).toBe(false)
    }
  })

  it('rechaza un 2 o un 4 en idiomas', () => {
    for (const bad of [2, 4]) {
      const body = validBody()
      const scores = { ...body.scores, idiomas: [bad] }
      const result = evaluationBodySchema.safeParse({ ...body, scores })
      expect(result.success).toBe(false)
      expect(JSON.stringify(result.error?.issues)).toContain('1, 3 o 5')
    }
  })

  it('rechaza una fecha con otro formato o imposible', () => {
    expect(
      evaluationBodySchema.safeParse({ ...validBody(), evaluatedOn: '11/09/2026' }).success,
    ).toBe(false)
    expect(
      evaluationBodySchema.safeParse({ ...validBody(), evaluatedOn: '2026-13-45' }).success,
    ).toBe(false)
  })

  it('las observaciones son opcionales pero tienen tope', () => {
    const { observations: _omit, ...sinObservaciones } = validBody()
    expect(evaluationBodySchema.safeParse(sinObservaciones).success).toBe(true)
    expect(
      evaluationBodySchema.safeParse({ ...validBody(), observations: 'x'.repeat(5001) }).success,
    ).toBe(false)
  })

  it('rechaza un id de colaborador que no es un entero positivo', () => {
    for (const bad of [0, -3, 'abc']) {
      expect(evaluationBodySchema.safeParse({ ...validBody(), evaluatedUserId: bad }).success).toBe(
        false,
      )
    }
  })
})

describe('cuerpo de la edición', () => {
  /** Las respuestas sin `evaluatedUserId`: editar no cambia a quién se evalúa. */
  function validAnswers(roleKey = 'arquitecto-l1') {
    const { evaluatedUserId: _ignored, ...rest } = validBody(roleKey)
    return rest
  }

  it('acepta un cambio de respuestas completo', () => {
    expect(evaluationPatchSchema.safeParse(validAnswers()).success).toBe(true)
  })

  it('acepta eliminar y restaurar por sí solos', () => {
    expect(evaluationPatchSchema.safeParse({ active: false }).success).toBe(true)
    expect(evaluationPatchSchema.safeParse({ active: true }).success).toBe(true)
  })

  it('rechaza un cuerpo vacío', () => {
    // Sin esto, un PATCH sin campos llegaría a construir un UPDATE sin SET.
    const result = evaluationPatchSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('No hay nada que actualizar')
  })

  it('no admite cambiar a quién se evalúa', () => {
    // Cambiar la persona no sería corregir esta evaluación: sería atribuirle a
    // otra las notas de la primera. El campo simplemente no existe aquí.
    const parsed = evaluationPatchSchema.parse({ ...validAnswers(), evaluatedUserId: 99 })
    expect('evaluatedUserId' in parsed).toBe(false)
  })

  it('exige rol, fecha y notas juntos', () => {
    // Notas nuevas con el rol viejo darían un promedio que no corresponde a
    // ninguno de los dos.
    const answers = validAnswers()
    for (const partial of [
      { scores: answers.scores },
      { scores: answers.scores, roleKey: answers.roleKey },
      { roleKey: answers.roleKey, evaluatedOn: answers.evaluatedOn },
    ]) {
      const result = evaluationPatchSchema.safeParse(partial)
      expect(result.success, JSON.stringify(partial).slice(0, 40)).toBe(false)
    }
  })

  it('aplica las mismas reglas de notas que el alta', () => {
    const answers = validAnswers('arquitecto-l1')
    const role = getRole('arquitecto-l1')!
    const languages = role.blocks.find((block) => block.scale === 'languages')!

    // La escala de idiomas sigue siendo cerrada: un 2 no significa nada ahí.
    const bad = {
      ...answers,
      scores: { ...answers.scores, [languages.key]: [2] },
    }
    expect(evaluationPatchSchema.safeParse(bad).success).toBe(false)
  })

  it('deja cambiar solo las observaciones', () => {
    // No mueven el promedio, pero sí lo que se le mandó a la IA.
    expect(evaluationPatchSchema.safeParse({ observations: 'Matiz nuevo.' }).success).toBe(true)
  })
})

describe('filtros del listado', () => {
  it('trae valores por defecto sensatos', () => {
    const result = evaluationListQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('no deja pedir páginas enormes', () => {
    expect(evaluationListQuerySchema.safeParse({ pageSize: 1000 }).success).toBe(false)
    expect(evaluationListQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })
})
