/**
 * Reparaciones de esquema del arranque.
 *
 * Esto decide renombrar tablas en la base de otra persona, así que lo que más
 * importa aquí no es que haga su trabajo, sino **que no haga nada más**: que
 * sea idempotente, que no pise lo que apartó ayer y que no toque una tabla
 * cuyo desajuste no reconoce.
 */
import { describe, it, expect } from 'vitest'
import { freeName, planRepairs, type SchemaShape } from '../../server/db/repairs'
import { expectedColumns } from '../../server/db/schema'

function shape(tables: Record<string, string[]>): SchemaShape {
  return new Map(Object.entries(tables).map(([table, cols]) => [table, new Set(cols)]))
}

/** Una base al día: todas las tablas del esquema con todas sus columnas. */
function current(): SchemaShape {
  return new Map([...expectedColumns()].map(([table, cols]) => [table, new Set(cols)]))
}

/** La `evaluations` del modelo de 27 indicadores: existe y no tiene role_key. */
const TABLA_VIEJA = ['id', 'idUser', 'idLextracking', 'indicators', 'total', 'created_at']

/** La tabla del modelo vigente, tal como se llamaba antes del 2026-09-27. */
const TABLA_IDEAL = [...expectedColumns().get('evaluations')!]

describe('planRepairs', () => {
  it('una base al día no necesita nada', () => {
    expect(planRepairs(current())).toEqual([])
  })

  it('una base vacía no necesita nada: el esquema la crea entera', () => {
    expect(planRepairs(shape({}))).toEqual([])
  })

  it('aparta la `evaluations` del modelo viejo', () => {
    const plan = planRepairs(shape({ evaluations: TABLA_VIEJA }))
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ from: 'evaluations', to: 'evaluations_old' })
  })

  it('el caso completo: aparta la vieja y mete la buena en su sitio', () => {
    // Es la base con la que se topó el incidente: la tabla del modelo de 27
    // indicadores ocupando el nombre, y las evaluaciones de verdad al lado.
    const plan = planRepairs(
      shape({ evaluations: TABLA_VIEJA, ideal_evaluations: TABLA_IDEAL, users: ['id'] }),
    )

    expect(plan.map((repair) => `${repair.from}→${repair.to}`)).toEqual([
      'evaluations→evaluations_old',
      'ideal_evaluations→evaluations',
    ])
  })

  it('el orden importa: sin apartar la vieja, la buena no tendría sitio', () => {
    // La segunda reparación solo se activa con el nombre libre, y lo libera la
    // primera dentro del mismo plan.
    const plan = planRepairs(shape({ evaluations: TABLA_VIEJA, ideal_evaluations: TABLA_IDEAL }))
    expect(plan[0]!.from).toBe('evaluations')
    expect(plan[1]!.from).toBe('ideal_evaluations')
  })

  it('mueve `ideal_evaluations` aunque no hubiera tabla vieja', () => {
    const plan = planRepairs(shape({ ideal_evaluations: TABLA_IDEAL }))
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ from: 'ideal_evaluations', to: 'evaluations' })
  })

  it('es idempotente: aplicar el plan y volver a arrancar no hace nada', () => {
    const base = shape({ evaluations: TABLA_VIEJA, ideal_evaluations: TABLA_IDEAL })

    // Se simula el resultado de ejecutar el plan.
    const despues = shape({ evaluations_old: TABLA_VIEJA, evaluations: TABLA_IDEAL })
    expect(planRepairs(base)).toHaveLength(2)
    expect(planRepairs(despues)).toEqual([])
  })

  it('no pisa lo que se apartó en un arranque anterior', () => {
    // Perder lo que se guardó "para mirarlo luego" sería lo contrario de lo
    // que busca este módulo.
    const plan = planRepairs(
      shape({ evaluations: TABLA_VIEJA, evaluations_old: ['id'], evaluations_old_2: ['id'] }),
    )
    expect(plan[0]!.to).toBe('evaluations_old_3')
  })

  it('NO aparta una tabla cuyo desajuste no reconoce', () => {
    /**
     * El test que justifica que no haya una regla genérica. Si "cualquier
     * tabla con la forma inesperada se aparta" fuera la norma, el día que
     * alguien añada una columna a `users` el arranque renombraría la tabla de
     * usuarios entera y crearía una vacía: todas las cuentas fuera, sin que
     * nadie lo pida. Esos casos los decide una persona.
     */
    const base = current()
    base.get('users')!.delete('lead_id')
    expect(planRepairs(base)).toEqual([])

    const sinColumna = current()
    sinColumna.get('api_keys')!.delete('scopes')
    expect(planRepairs(sinColumna)).toEqual([])
  })

  it('tampoco toca una `evaluations` que ya es la buena', () => {
    // La precondición mira `role_key`, que es lo que distingue un modelo del
    // otro: sin eso, cada arranque apartaría la tabla en uso.
    expect(planRepairs(shape({ evaluations: TABLA_IDEAL }))).toEqual([])
  })
})

describe('freeName', () => {
  it('devuelve el nombre pedido si está libre', () => {
    expect(freeName('evaluations_old', new Set())).toBe('evaluations_old')
  })

  it('va numerando mientras estén ocupados', () => {
    expect(freeName('t', new Set(['t']))).toBe('t_2')
    expect(freeName('t', new Set(['t', 't_2', 't_3']))).toBe('t_4')
  })
})
