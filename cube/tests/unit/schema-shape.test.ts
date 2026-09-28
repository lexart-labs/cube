/**
 * Detección de tablas con el nombre correcto y la forma equivocada.
 *
 * Esto existe por un incidente real del 2026-09-27: al renombrar
 * `ideal_evaluations` a `evaluations`, el nombre ya estaba ocupado en la base
 * por la tabla del modelo de 27 indicadores. `CREATE TABLE IF NOT EXISTS` mira
 * el nombre y no la forma, así que el arranque no hizo nada, no se quejó, y el
 * fallo apareció mucho después como `Unknown column 'e.role_key' in 'field
 * list'` en cada pantalla.
 *
 * Lo que se prueba aquí es que eso se ve ANTES de servir tráfico.
 */
import { describe, it, expect } from 'vitest'
import { expectedColumns, findSchemaMismatches } from '../../server/db/schema'

/** Lo que devuelve la base: tabla -> columnas que tiene de verdad. */
function actual(tables: Record<string, string[]>): Map<string, Set<string>> {
  return new Map(Object.entries(tables).map(([table, cols]) => [table, new Set(cols)]))
}

describe('expectedColumns', () => {
  it('saca las columnas de cada tabla del esquema', () => {
    const tables = expectedColumns()
    expect([...tables.keys()].sort()).toEqual(
      [
        'api_key_allowlist',
        'api_keys',
        'audit_log',
        'evaluations',
        'levels',
        'positions',
        'sessions',
        'users',
      ].sort(),
    )
  })

  it('reconoce las columnas de evaluaciones, incluida la que faltaba', () => {
    const columns = expectedColumns().get('evaluations')!
    expect(columns).toContain('role_key')
    expect(columns).toContain('weighted_average')
    expect(columns).toContain('narrative_es')
    expect(columns).toContain('active')
  })

  it('no confunde índices y claves con columnas', () => {
    // `PRIMARY KEY (...)`, `KEY idx_…`, `CONSTRAINT fk_…` no son columnas, y
    // colarlas haría que la verificación pidiera columnas inexistentes y
    // dejara la aplicación en 503 para siempre.
    for (const columns of expectedColumns().values()) {
      for (const column of columns) {
        expect(column, column).toMatch(/^[a-z_][a-z0-9_]*$/)
        expect(['primary', 'unique', 'key', 'constraint', 'foreign', 'index']).not.toContain(column)
      }
    }
    expect(expectedColumns().get('users')).not.toContain('uq_users_email')
  })
})

describe('findSchemaMismatches', () => {
  /** Una base sana: todas las tablas con todas sus columnas. */
  function healthy(): Map<string, Set<string>> {
    return new Map([...expectedColumns()].map(([table, cols]) => [table, new Set(cols)]))
  }

  it('una base correcta no tiene problemas', () => {
    expect(findSchemaMismatches(healthy())).toEqual([])
  })

  it('una tabla que aún no existe no es un problema: la crea el esquema', () => {
    const base = healthy()
    base.delete('evaluations')
    expect(findSchemaMismatches(base)).toEqual([])
  })

  it('detecta el caso real: `evaluations` con la forma del modelo viejo', () => {
    const base = healthy()
    // Así era la tabla de los 27 indicadores que ocupaba ese nombre.
    base.set(
      'evaluations',
      new Set(['id', 'idUser', 'idLextracking', 'indicators', 'total', 'created_at']),
    )

    const problems = findSchemaMismatches(base)
    expect(problems).toHaveLength(1)
    expect(problems[0]!.table).toBe('evaluations')
    expect(problems[0]!.missing).toContain('role_key')
    expect(problems[0]!.missing).toContain('weighted_average')
  })

  it('las columnas de más no molestan', () => {
    // Una columna añadida a mano no rompe nada y avisar de ella convertiría
    // cualquier retoque en un arranque fallido.
    const base = healthy()
    base.get('users')!.add('columna_de_alguien')
    expect(findSchemaMismatches(base)).toEqual([])
  })

  it('informa de todas las tablas afectadas, no solo de la primera', () => {
    const base = healthy()
    base.get('evaluations')!.delete('role_key')
    base.get('users')!.delete('password_hash')

    const problems = findSchemaMismatches(base)
    expect(problems.map((problem) => problem.table).sort()).toEqual(['evaluations', 'users'])
  })
})

describe('degradación proporcionada', () => {
  it('el esquema roto pesa más que el ping y no se limpia solo', async () => {
    /**
     * Que la base no responda es transitorio y `/api/health` lo recupera al
     * repasar; una tabla con la forma equivocada no. Si el sondeo pudiera
     * limpiar este estado, la aplicación volvería sola a servir 500.
     */
    const { setDatabaseReady, isDatabaseReady, setSchemaProblem, getSchemaProblem } =
      await import('../../server/utils/health')

    setSchemaProblem({ detail: 'faltan columnas', tables: ['evaluations'] })
    setDatabaseReady(true)

    expect(isDatabaseReady()).toBe(true)
    expect(getSchemaProblem()).not.toBeNull()

    setSchemaProblem(null)
    expect(getSchemaProblem()).toBeNull()
  })

  it('una tabla rota no tumba la aplicación entera', async () => {
    /**
     * EL test de este fichero. La segunda versión de la salvaguarda cortaba la
     * API entera ante cualquier desajuste, y con `evaluations` mal formada
     * dejaba a la gente sin poder ni iniciar sesión: una pantalla rota
     * convertida en una aplicación inservible.
     */
    const { routesAffectedBy } = await import('../../server/utils/health')

    const afectadas = routesAffectedBy(['evaluations'])
    expect(afectadas).toEqual(['/api/evaluations'])
    expect(afectadas).not.toContain('/api/auth')
    expect(afectadas).not.toContain('/api/users')
  })

  it('si lo roto es users, cae lo que de verdad depende de users', async () => {
    const { routesAffectedBy } = await import('../../server/utils/health')
    expect(routesAffectedBy(['users'])).toContain('/api/auth')
  })

  it('una tabla desconocida no bloquea nada', async () => {
    // Control de disponibilidad, no de seguridad: ante la duda se sirve, que
    // el coste de equivocarse es dejar a alguien fuera de su herramienta.
    const { routesAffectedBy } = await import('../../server/utils/health')
    expect(routesAffectedBy(['tabla_que_nadie_conoce'])).toEqual([])
  })

  it('la auditoría rota no bloquea nada', async () => {
    // `audit()` ya se traga sus propios fallos: nunca tumba la operación.
    const { routesAffectedBy } = await import('../../server/utils/health')
    expect(routesAffectedBy(['audit_log'])).toEqual([])
  })
})
