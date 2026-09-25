/**
 * Coherencia del esquema.
 *
 * Sin MySQL no se puede ejecutar, pero sí comprobar las propiedades que lo
 * hacen seguro de aplicar en cada arranque: que sea idempotente y que sus
 * claves foráneas apunten a tablas que existen y se crean antes.
 *
 * Un error aquí solo se manifestaría al desplegar contra una base vacía, que es
 * el peor momento para descubrirlo.
 */
import { describe, it, expect } from 'vitest'
import { SCHEMA_SQL, schemaStatements } from '../../server/db/schema'

const statements = schemaStatements()

const createTable = statements.filter((s) => s.startsWith('CREATE TABLE'))

/** Nombres de las tablas, en el orden en que se crean. */
const tableNames = createTable.map((s) => {
  const match = s.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/)
  return match![1]!
})

describe('esquema', () => {
  it('crea las 6 tablas del modelo', () => {
    expect(tableNames.sort()).toEqual(
      ['audit_log', 'ideal_evaluations', 'levels', 'positions', 'sessions', 'users'].sort(),
    )
  })

  it('toda creación de tabla es idempotente', () => {
    // Se aplica en cada arranque: sin IF NOT EXISTS, el segundo fallaría.
    for (const statement of createTable) {
      expect(statement, statement.slice(0, 60)).toContain('CREATE TABLE IF NOT EXISTS')
    }
  })

  it('ninguna sentencia queda vacía tras el troceado', () => {
    for (const statement of statements) {
      expect(statement.trim().length).toBeGreaterThan(0)
    }
  })

  it('las claves foráneas apuntan a tablas del propio esquema', () => {
    const known = new Set(tableNames)
    const referenced = [...SCHEMA_SQL.matchAll(/REFERENCES\s+(\w+)\s*\(/g)].map((m) => m[1]!)

    expect(referenced.length).toBeGreaterThan(3)
    const unknown = [...new Set(referenced)].filter((table) => !known.has(table))
    expect(unknown).toEqual([])
  })

  it('no hay claves foráneas hacia atrás sin desactivar la comprobación', () => {
    /**
     * El esquema envuelve todo en SET FOREIGN_KEY_CHECKS = 0/1 justamente para
     * poder crear las tablas en cualquier orden. Si eso desapareciera, el orden
     * pasaría a importar y una referencia adelantada rompería el arranque.
     */
    expect(SCHEMA_SQL).toContain('SET FOREIGN_KEY_CHECKS = 0')
    expect(SCHEMA_SQL).toContain('SET FOREIGN_KEY_CHECKS = 1')
  })

  it('todas las tablas usan utf8mb4', () => {
    // v1 mezclaba utf8mb3 y utf8mb4, lo que rompe emojis y algunos acentos.
    for (const statement of createTable) {
      expect(statement, tableNames[createTable.indexOf(statement)]).toContain('utf8mb4')
    }
  })

  it('la tabla de sesiones guarda el hash del token, no el token', () => {
    const sessions = createTable.find((s) => s.includes('CREATE TABLE IF NOT EXISTS sessions'))!
    expect(sessions).toContain('token_hash')
    expect(sessions).not.toMatch(/\btoken\s+VARCHAR/)
  })
})
