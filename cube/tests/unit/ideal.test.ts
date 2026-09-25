/**
 * Catálogo y cálculo de IDEAL LEXART.
 *
 * El promedio ponderado es el número que acaba en la evaluación de una persona
 * y en el prompt de la IA. Se prueba con casos calculados a mano, no con la
 * propia implementación como referencia.
 */
import { describe, it, expect } from 'vitest'
import {
  IDEAL_ROLES,
  IDEAL_ROLE_KEYS,
  LANGUAGE_SCORES,
  blockAverage,
  emptyScores,
  getRole,
  isComplete,
  isValidScore,
  scorePercent,
  weightedAverage,
} from '../../shared/ideal'

/**
 * Rellena todas las preguntas de un rol con el mismo valor.
 *
 * El bloque de idiomas no admite 2 ni 4, así que ahí se baja al valor válido
 * inmediatamente inferior. Lo descubrió este mismo helper al fallar el test.
 */
function allAt(roleKey: string, value: number) {
  const role = getRole(roleKey)!
  return Object.fromEntries(
    role.blocks.map((b) => {
      const scoped = b.scale === 'languages' ? nearestLanguageScore(value) : value
      return [b.key, b.questions.map(() => scoped)]
    }),
  )
}

function nearestLanguageScore(value: number): number {
  const valid = [...LANGUAGE_SCORES].filter((option) => option <= value)
  return valid.length ? valid[valid.length - 1]! : LANGUAGE_SCORES[0]
}

describe('catálogo', () => {
  it('tiene los cuatro roles del estándar', () => {
    expect(IDEAL_ROLE_KEYS).toEqual([
      'arquitecto-l1',
      'arquitecto-l2',
      'arquitecto-l3',
      'desarrollador-l3',
    ])
  })

  it.each(IDEAL_ROLE_KEYS)('los pesos de %s suman 100', (roleKey) => {
    const total = getRole(roleKey)!.blocks.reduce((sum, block) => sum + block.weight, 0)
    expect(total).toBe(100)
  })

  it('cada rol respeta los pesos del estándar', () => {
    const weights = Object.fromEntries(
      IDEAL_ROLE_KEYS.map((key) => [
        key,
        Object.fromEntries(getRole(key)!.blocks.map((b) => [b.key, b.weight])),
      ]),
    )

    expect(weights['arquitecto-l1']).toEqual({
      hardSkills: 45,
      leadership: 35,
      comercial: 10,
      idiomas: 10,
    })
    expect(weights['arquitecto-l2']).toEqual({
      hardSkills: 40,
      leadership: 30,
      comercial: 20,
      idiomas: 10,
    })
    expect(weights['arquitecto-l3']).toEqual({
      hardSkills: 35,
      leadership: 35,
      comercial: 20,
      idiomas: 10,
    })
    expect(weights['desarrollador-l3']).toEqual({
      hardSkills: 50,
      sdlc: 30,
      autonomia: 10,
      idiomas: 10,
    })
  })

  it('todos los bloques tienen al menos una pregunta y ninguna vacía', () => {
    for (const role of Object.values(IDEAL_ROLES)) {
      for (const block of role.blocks) {
        expect(block.questions.length).toBeGreaterThan(0)
        for (const question of block.questions) expect(question.trim()).not.toBe('')
      }
    }
  })

  it('el bloque de idiomas es de escala cerrada en todos los roles', () => {
    for (const role of Object.values(IDEAL_ROLES)) {
      const idiomas = role.blocks.find((b) => b.key === 'idiomas')
      expect(idiomas?.scale).toBe('languages')
      expect(idiomas?.weight).toBe(10)
    }
  })

  it('un rol desconocido no devuelve nada, en vez de un rol por defecto', () => {
    expect(getRole('director-general')).toBeNull()
    expect(emptyScores('director-general')).toEqual({})
  })
})

describe('validación de notas', () => {
  it('la escala lineal acepta de 1 a 5 enteros', () => {
    for (const value of [1, 2, 3, 4, 5]) expect(isValidScore(value, 'linear')).toBe(true)
    for (const value of [0, 6, -1, 3.5]) expect(isValidScore(value, 'linear')).toBe(false)
  })

  it('la escala de idiomas solo acepta 1, 3 y 5', () => {
    for (const value of LANGUAGE_SCORES) expect(isValidScore(value, 'languages')).toBe(true)
    // Un 2 o un 4 no significan nada: no hay "dos idiomas y medio".
    for (const value of [2, 4, 0, 6]) expect(isValidScore(value, 'languages')).toBe(false)
  })

  it('rechaza lo que no es número', () => {
    for (const value of ['3', null, undefined, NaN, {}]) {
      expect(isValidScore(value, 'linear')).toBe(false)
    }
  })

  it('isComplete exige todas las preguntas del rol', () => {
    const scores = allAt('arquitecto-l1', 4)
    expect(isComplete('arquitecto-l1', scores)).toBe(true)

    const faltaUna = { ...scores, hardSkills: scores.hardSkills!.slice(1) }
    expect(isComplete('arquitecto-l1', faltaUna)).toBe(false)

    const sobraUna = { ...scores, comercial: [...scores.comercial!, 5] }
    expect(isComplete('arquitecto-l1', sobraUna)).toBe(false)

    const sinBloque = { ...scores }
    delete sinBloque.idiomas
    expect(isComplete('arquitecto-l1', sinBloque)).toBe(false)
  })

  it('el formulario vacío está completo y vale 3 en todo', () => {
    for (const roleKey of IDEAL_ROLE_KEYS) {
      const scores = emptyScores(roleKey)
      expect(isComplete(roleKey, scores)).toBe(true)
      expect(weightedAverage(roleKey, scores)).toBe(3)
    }
  })
})

describe('promedio ponderado', () => {
  it('todo al máximo da 5, todo al mínimo da 1', () => {
    for (const roleKey of IDEAL_ROLE_KEYS) {
      expect(weightedAverage(roleKey, allAt(roleKey, 5))).toBe(5)
      expect(weightedAverage(roleKey, allAt(roleKey, 1))).toBe(1)
    }
  })

  it('pondera por bloque, no por número de preguntas', () => {
    // Arquitecto L1: hardSkills 45 %, leadership 35 %, comercial 10 %, idiomas 10 %.
    // hardSkills tiene 5 preguntas y comercial 2; lo que manda es el peso.
    const scores = {
      hardSkills: [5, 5, 5, 5, 5],
      leadership: [1, 1, 1, 1, 1],
      comercial: [1, 1],
      idiomas: [1],
    }
    // 5·0.45 + 1·0.35 + 1·0.10 + 1·0.10 = 2.25 + 0.55 = 2.80
    expect(weightedAverage('arquitecto-l1', scores)).toBe(2.8)
  })

  it('un caso a mano por rol', () => {
    // Desarrollador L3: 50 / 30 / 10 / 10.
    // hardSkills media 4, sdlc media 3, autonomia media 5, idiomas 3.
    // 4·0.5 + 3·0.3 + 5·0.1 + 3·0.1 = 2 + 0.9 + 0.5 + 0.3 = 3.70
    expect(
      weightedAverage('desarrollador-l3', {
        hardSkills: [4, 4, 4, 4],
        sdlc: [3, 3, 3, 3, 3],
        autonomia: [5, 5],
        idiomas: [3],
      }),
    ).toBe(3.7)

    // Arquitecto L3: 35 / 35 / 20 / 10 con medias 5, 4, 3, 5.
    // 1.75 + 1.4 + 0.6 + 0.5 = 4.25
    expect(
      weightedAverage('arquitecto-l3', {
        hardSkills: [5, 5, 5, 5],
        leadership: [4, 4, 4, 4, 4],
        comercial: [3, 3, 3],
        idiomas: [5],
      }),
    ).toBe(4.25)
  })

  it('redondea a dos decimales', () => {
    // Arquitecto L2, hardSkills con media 3.4 (17/5) y el resto en 3.
    // 3.4·0.4 + 3·0.3 + 3·0.2 + 3·0.1 = 1.36 + 1.8 = 3.16
    expect(
      weightedAverage('arquitecto-l2', {
        hardSkills: [3, 3, 3, 4, 4],
        leadership: [3, 3, 3, 3, 3],
        comercial: [3, 3, 3],
        idiomas: [3],
      }),
    ).toBe(3.16)
  })

  it('devuelve 0 si falta una nota, en vez de inventarse un promedio', () => {
    const scores = allAt('arquitecto-l1', 4)
    delete scores.comercial
    expect(weightedAverage('arquitecto-l1', scores)).toBe(0)
    expect(weightedAverage('rol-que-no-existe', allAt('arquitecto-l1', 4))).toBe(0)
  })

  it('la media de un bloque vacío es 0 y no NaN', () => {
    expect(blockAverage([])).toBe(0)
  })
})

describe('porcentaje', () => {
  it('la escala empieza en 1, así que el mínimo es 20 %', () => {
    expect(scorePercent(1)).toBe(20)
    expect(scorePercent(5)).toBe(100)
    expect(scorePercent(3)).toBe(60)
    expect(scorePercent(3.7)).toBe(74)
  })
})
