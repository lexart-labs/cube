/**
 * Las reglas de mapeo son lo que puede corromper datos sin que se note.
 * Asignar una evaluación al desarrollador equivocado no lanza ningún error:
 * simplemente queda mal para siempre.
 */
import { describe, it, expect } from 'vitest'
import { mapRole, buildCanonicalIndex, resolveEvaluatedUser } from '../../server/db/mapping'

describe('mapRole', () => {
  it.each([
    ['admin', 'admin'],
    ['lead', 'lead'],
    ['pm', 'lead'],
    ['manager', 'lead'],
    ['developer', 'developer'],
    ['dev', 'developer'],
  ])('traduce "%s" a %s', (input, expected) => {
    const result = mapRole(input)
    expect(result.role).toBe(expected)
    expect(result.recognized).toBe(true)
  })

  it('no distingue mayúsculas ni espacios', () => {
    expect(mapRole('  ADMIN ').role).toBe('admin')
  })

  it('trata el vacío y el nulo como developer', () => {
    expect(mapRole('').recognized).toBe(true)
    expect(mapRole(null).role).toBe('developer')
  })

  it('marca como no reconocido un tipo desconocido, sin romper', () => {
    const result = mapRole('rrhh')
    expect(result.role).toBe('developer')
    expect(result.recognized).toBe(false)
  })
})

describe('buildCanonicalIndex', () => {
  it('usa idLextracking cuando existe', () => {
    const { index } = buildCanonicalIndex([{ id: 7, idLextracking: 500 }])
    expect(index.get(500)).toBe(7)
    expect(index.get(7)).toBeUndefined()
  })

  it('cae al id cuando idLextracking es null — el caso de la fila 154 del seed', () => {
    // El usuario 105 tiene idLextracking null, y la evaluación 154 apunta a 105.
    const { index } = buildCanonicalIndex([{ id: 105, idLextracking: null }])
    expect(index.get(105)).toBe(105)
  })

  it('detecta ambigüedad entre el id de uno y el idLextracking de otro', () => {
    const { ambiguous } = buildCanonicalIndex([
      { id: 105, idLextracking: null }, // clave 105
      { id: 9, idLextracking: 105 }, // clave 105 otra vez
    ])
    expect(ambiguous).toEqual([105])
  })

  it('no marca ambigüedad cuando no la hay', () => {
    const { ambiguous } = buildCanonicalIndex([
      { id: 1, idLextracking: null },
      { id: 2, idLextracking: 500 },
    ])
    expect(ambiguous).toEqual([])
  })
})

describe('resolveEvaluatedUser', () => {
  const { index } = buildCanonicalIndex([
    { id: 105, idLextracking: null },
    { id: 33, idLextracking: 900 },
  ])

  it('resuelve la evaluación real del seed (idLextracking=105 -> usuario 105)', () => {
    expect(resolveEvaluatedUser(105, index)).toBe(105)
  })

  it('resuelve por idLextracking externo', () => {
    expect(resolveEvaluatedUser(900, index)).toBe(33)
  })

  it('devuelve null para huérfanas en vez de inventar un usuario', () => {
    expect(resolveEvaluatedUser(99999, index)).toBeNull()
    expect(resolveEvaluatedUser(null, index)).toBeNull()
    expect(resolveEvaluatedUser('abc', index)).toBeNull()
  })
})
