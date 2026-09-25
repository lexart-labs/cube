/**
 * Validación del cuerpo de una evaluación IDEAL.
 *
 * No basta con "números entre 1 y 5": si los bloques no son exactamente los del
 * rol, el promedio ponderado sale de otra fórmula sin que nadie se entere. Eso
 * es lo que se prueba aquí.
 */
import { describe, it, expect } from 'vitest'
import { idealBodySchema, idealListQuerySchema } from '../../server/api/ideal/_schema'
import { getRole } from '../../shared/ideal'

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
    expect(idealBodySchema.safeParse(validBody()).success).toBe(true)
  })

  it('acepta los cuatro roles del catálogo', () => {
    for (const roleKey of ['arquitecto-l1', 'arquitecto-l2', 'arquitecto-l3', 'desarrollador-l3']) {
      expect(idealBodySchema.safeParse(validBody(roleKey)).success).toBe(true)
    }
  })

  it('rechaza un rol que no existe', () => {
    const result = idealBodySchema.safeParse({ ...validBody(), roleKey: 'director-general' })
    expect(result.success).toBe(false)
  })

  it('rechaza bloques que no son los del rol', () => {
    const body = validBody('arquitecto-l1')
    // `sdlc` es de Desarrollador L3, no de Arquitecto L1.
    const scores = { ...body.scores, sdlc: [3, 3, 3, 3, 3] }
    const result = idealBodySchema.safeParse({ ...body, scores })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('no corresponden al rol')
  })

  it('rechaza que falte un bloque', () => {
    const body = validBody()
    const scores = { ...body.scores }
    delete (scores as Record<string, unknown>).comercial
    expect(idealBodySchema.safeParse({ ...body, scores }).success).toBe(false)
  })

  it('rechaza un bloque con menos notas que preguntas', () => {
    const body = validBody()
    const scores = { ...body.scores, hardSkills: [3, 3] }
    const result = idealBodySchema.safeParse({ ...body, scores })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('espera 5 notas')
  })

  it('rechaza notas fuera de 1-5', () => {
    for (const bad of [0, 6, -1, 2.5]) {
      const body = validBody()
      const scores = { ...body.scores, hardSkills: [bad, 3, 3, 3, 3] }
      expect(idealBodySchema.safeParse({ ...body, scores }).success).toBe(false)
    }
  })

  it('rechaza un 2 o un 4 en idiomas', () => {
    for (const bad of [2, 4]) {
      const body = validBody()
      const scores = { ...body.scores, idiomas: [bad] }
      const result = idealBodySchema.safeParse({ ...body, scores })
      expect(result.success).toBe(false)
      expect(JSON.stringify(result.error?.issues)).toContain('1, 3 o 5')
    }
  })

  it('rechaza una fecha con otro formato o imposible', () => {
    expect(idealBodySchema.safeParse({ ...validBody(), evaluatedOn: '11/09/2026' }).success).toBe(
      false,
    )
    expect(idealBodySchema.safeParse({ ...validBody(), evaluatedOn: '2026-13-45' }).success).toBe(
      false,
    )
  })

  it('las observaciones son opcionales pero tienen tope', () => {
    const { observations: _omit, ...sinObservaciones } = validBody()
    expect(idealBodySchema.safeParse(sinObservaciones).success).toBe(true)
    expect(
      idealBodySchema.safeParse({ ...validBody(), observations: 'x'.repeat(5001) }).success,
    ).toBe(false)
  })

  it('rechaza un id de colaborador que no es un entero positivo', () => {
    for (const bad of [0, -3, 'abc']) {
      expect(idealBodySchema.safeParse({ ...validBody(), evaluatedUserId: bad }).success).toBe(false)
    }
  })
})

describe('filtros del listado', () => {
  it('trae valores por defecto sensatos', () => {
    const result = idealListQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('no deja pedir páginas enormes', () => {
    expect(idealListQuerySchema.safeParse({ pageSize: 1000 }).success).toBe(false)
    expect(idealListQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })
})
