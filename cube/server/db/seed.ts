/**
 * Datos de ejemplo, por línea de comandos.
 *
 * La lógica vive en `bootstrap.ts` y la comparte el arranque del servidor, para
 * que no existan dos versiones que puedan divergir.
 *
 * Uso:  node server/db/seed.ts
 *
 * En el arranque del servidor esto ocurre solo si `NUXT_SEED_ON_STARTUP=true`
 * y la base no tiene ningún usuario.
 */
import mysql from 'mysql2/promise'
import { ensureSchema, countUsers, seedDemoData, seedSummary } from './bootstrap.ts'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    throw new Error(
      'La semilla crea cuentas con contraseña conocida y NODE_ENV=production.\n' +
        'Si de verdad es lo que quieres, exporta SEED_FORCE=true.',
    )
  }

  const connection = await mysql.createConnection({
    host: required('NUXT_DB_HOST'),
    port: Number(process.env.NUXT_DB_PORT ?? 3306),
    user: required('NUXT_DB_USER'),
    password: required('NUXT_DB_PASSWORD'),
    database: required('NUXT_DB_NAME'),
    dateStrings: true,
  })

  try {
    log('Aplicando el esquema…')
    const statements = await ensureSchema(connection)
    log(`  ${statements} sentencias.`)

    const users = await countUsers(connection)
    if (users > 0 && process.env.SEED_FORCE !== 'true') {
      log(`\nLa base ya tiene ${users} usuarios. No se toca nada.`)
      log('Si de verdad quieres re-sembrar, exporta SEED_FORCE=true.')
      return
    }

    log('Sembrando…')
    await seedDemoData(connection)

    log('')
    for (const line of seedSummary()) log(line)
  } finally {
    await connection.end()
  }
}

main().catch((error: unknown) => {
  log(`\nLa semilla falló: ${(error as Error).message}`)
  process.exitCode = 1
})
