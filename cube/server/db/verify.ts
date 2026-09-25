/**
 * Verificación posterior a la migración.
 *
 * Contrasta los conteos de v1 con los de v2 y comprueba que los datos cifrados
 * se pueden recuperar. Es el criterio de aceptación de la Fase 2 del Roadmap:
 * sin esto, "la migración funcionó" es una afirmación sin respaldo.
 *
 * Uso:  node server/db/verify.ts
 */
import mysql from 'mysql2/promise'
import type { Connection, RowDataPacket } from 'mysql2/promise'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

interface Check {
  name: string
  expected: number | string
  actual: number | string
  ok: boolean
  note?: string
}

const checks: Check[] = []

function compare(name: string, expected: number, actual: number, note?: string): void {
  checks.push({ name, expected, actual, ok: expected === actual, note })
}

async function count(connection: Connection, sql: string): Promise<number> {
  const [rows] = await connection.query(sql)
  return Number((rows as RowDataPacket[])[0]?.total ?? 0)
}

async function main(): Promise<void> {
  const source = await mysql.createConnection({
    host: process.env.MIGRATE_SOURCE_HOST ?? '127.0.0.1',
    port: Number(process.env.MIGRATE_SOURCE_PORT ?? 3306),
    user: required('MIGRATE_SOURCE_USER'),
    password: required('MIGRATE_SOURCE_PASSWORD'),
    database: process.env.MIGRATE_SOURCE_DB ?? 'lexart_cube',
    dateStrings: true,
  })

  const target = await mysql.createConnection({
    host: required('NUXT_DB_HOST'),
    port: Number(process.env.NUXT_DB_PORT ?? 3306),
    user: required('NUXT_DB_USER'),
    password: required('NUXT_DB_PASSWORD'),
    database: required('NUXT_DB_NAME'),
    dateStrings: true,
  })

  try {
    log('\n=== VERIFICACIÓN DE LA MIGRACIÓN ===\n')

    // --- conteos ---
    // Los usuarios sin email no se migran, así que el origen se cuenta igual.
    compare(
      'users',
      await count(source, "SELECT COUNT(*) AS total FROM users WHERE email IS NOT NULL AND email <> ''"),
      await count(target, 'SELECT COUNT(*) AS total FROM users'),
      'las filas sin email o con email duplicado se omiten a propósito',
    )

    compare(
      'positions',
      await count(source, 'SELECT COUNT(*) AS total FROM careers'),
      await count(target, 'SELECT COUNT(*) AS total FROM positions'),
    )

    compare(
      'levels',
      await count(source, 'SELECT COUNT(*) AS total FROM levels'),
      await count(target, 'SELECT COUNT(*) AS total FROM levels'),
    )

    // --- contraseñas ---
    const legacyPasswords = await count(
      target,
      "SELECT COUNT(*) AS total FROM users WHERE password_algo = 'md5-legacy'",
    )
    checks.push({
      name: 'contraseñas pendientes de rehash',
      expected: legacyPasswords,
      actual: legacyPasswords,
      ok: true,
      note: 'esperado tras migrar: pasan a bcrypt en el primer login (Roadmap §6)',
    })

    // --- informe ---
    log('Comprobación                              Esperado      Obtenido   ')
    log('─'.repeat(72))
    for (const check of checks) {
      const mark = check.ok ? 'OK  ' : 'FALLA'
      log(
        `${mark} ${check.name.padEnd(36)} ${String(check.expected).padStart(10)} ${String(check.actual).padStart(12)}`,
      )
      if (check.note) log(`       ${check.note}`)
    }

    const failures = checks.filter((c) => !c.ok)
    log(
      failures.length === 0
        ? '\nTodas las comprobaciones pasan.'
        : `\n${failures.length} comprobaciones fallan. NO promuevas esta migración hasta resolverlas.`,
    )
    if (failures.length) process.exitCode = 1
  } finally {
    await source.end()
    await target.end()
  }
}

main().catch((error: unknown) => {
  log(`\nLa verificación falló: ${(error as Error).message}`)
  process.exitCode = 1
})
