/**
 * Migración v1 → v2.
 *
 * Lee de la base de v1 (`lexart_cube`) y ESCRIBE EN UNA BASE NUEVA con el
 * esquema de v2. No transforma v1 en el sitio.
 *
 * Solo migra lo que v2 conserva: **catálogos y usuarios**. Ni el onboarding
 * (AD-06) ni las evaluaciones de los 27 indicadores, cuyo modelo se retiró
 * entero el 2026-09-25: su escala sobre 135 no es convertible al promedio
 * ponderado de IDEAL, así que se quedan en la base de v1 y en su backup.
 *
 * El Roadmap describía una transformación en el sitio; se cambió por esto
 * porque es netamente más seguro: v1 sigue intacta y en marcha durante la
 * migración, la verificación puede comparar ambas bases en vivo, y revertir es
 * simplemente descartar la base nueva. Con docker compose, además, la base de
 * v2 es un contenedor recién creado, donde "en el sitio" ni siquiera aplica.
 *
 * Uso:
 *   node server/db/migrate.ts --dry-run    # no escribe nada, informa qué haría
 *   node server/db/migrate.ts
 *
 * Configuración por entorno:
 *   MIGRATE_SOURCE_HOST / _PORT / _USER / _PASSWORD / _DB   (v1, def. lexart_cube)
 *   NUXT_DB_*                                                (destino v2)
 */
import mysql from 'mysql2/promise'
import type { Connection, RowDataPacket } from 'mysql2/promise'
import { mapRole as mapRoleRule, buildCanonicalIndex, resolveEvaluatedUser } from './mapping.ts'
import { ensureSchema } from './bootstrap.ts'

const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Informe
// ---------------------------------------------------------------------------

interface StepReport {
  step: string
  read: number
  written: number
  skipped: number
  warnings: string[]
}

const report: StepReport[] = []
const blockers: string[] = []

function step(name: string): StepReport {
  const entry: StepReport = { step: name, read: 0, written: 0, skipped: 0, warnings: [] }
  report.push(entry)
  return entry
}

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

// ---------------------------------------------------------------------------
// Conexiones
// ---------------------------------------------------------------------------

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }
  return value
}

async function connectSource(): Promise<Connection> {
  return mysql.createConnection({
    host: process.env.MIGRATE_SOURCE_HOST ?? '127.0.0.1',
    port: Number(process.env.MIGRATE_SOURCE_PORT ?? 3306),
    user: required('MIGRATE_SOURCE_USER'),
    password: required('MIGRATE_SOURCE_PASSWORD'),
    database: process.env.MIGRATE_SOURCE_DB ?? 'lexart_cube',
    dateStrings: true,
    multipleStatements: false,
  })
}

async function connectTarget(): Promise<Connection> {
  return mysql.createConnection({
    host: required('NUXT_DB_HOST'),
    port: Number(process.env.NUXT_DB_PORT ?? 3306),
    user: required('NUXT_DB_USER'),
    password: required('NUXT_DB_PASSWORD'),
    database: required('NUXT_DB_NAME'),
    dateStrings: true,
    // El esquema se aplica como un único script con muchas sentencias.
    multipleStatements: true,
  })
}

async function readRows<T = RowDataPacket>(
  connection: Connection,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await connection.query(sql, params)
  return rows as T[]
}

/** Inserta salvo en dry-run. Devuelve `true` si escribió. */
async function write(
  connection: Connection,
  sql: string,
  params: unknown[],
): Promise<boolean> {
  if (DRY_RUN) return false
  await connection.query(sql, params)
  return true
}

// ---------------------------------------------------------------------------
// Pasos
// ---------------------------------------------------------------------------

/**
 * Aplica el esquema al destino. Idempotente (CREATE TABLE IF NOT EXISTS).
 *
 * Viene del módulo `schema.ts` y no de un fichero suelto: Nitro empaqueta
 * JavaScript, no ficheros de datos, así que un `readFile` funcionaría aquí y
 * fallaría dentro del contenedor.
 */
async function applySchema(target: Connection): Promise<void> {
  const entry = step('esquema')

  if (DRY_RUN) {
    entry.warnings.push('dry-run: el esquema no se aplica')
    return
  }

  entry.written = await ensureSchema(target)
}

/** `careers` → `positions`. Se descartan roadmap, idCompany e idCareerType. */
async function migratePositions(source: Connection, target: Connection): Promise<void> {
  const entry = step('positions (ex careers)')
  const rows = await readRows<RowDataPacket>(
    source,
    'SELECT id, position, active, minimumTime FROM careers ORDER BY id',
  )
  entry.read = rows.length

  const seen = new Set<string>()
  for (const row of rows) {
    const name = String(row.position ?? '').trim()
    if (!name) {
      entry.skipped++
      entry.warnings.push(`position id=${row.id} sin nombre; omitida`)
      continue
    }
    // `positions.name` es UNIQUE en v2 y v1 no lo era.
    if (seen.has(name.toLowerCase())) {
      entry.skipped++
      entry.warnings.push(`position id=${row.id} "${name}" duplicada; omitida`)
      continue
    }
    seen.add(name.toLowerCase())

    if (
      await write(
        target,
        `INSERT INTO positions (id, name, minimum_time_months, active)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [row.id, name, row.minimumTime ?? 0, row.active ?? 1],
      )
    ) {
      entry.written++
    }
  }
}

/** `levels` → `levels`. Se descartan idCompany e idCareerType. */
async function migrateLevels(source: Connection, target: Connection): Promise<void> {
  const entry = step('levels')
  const rows = await readRows<RowDataPacket>(
    source,
    'SELECT id, level, active FROM levels ORDER BY id',
  )
  entry.read = rows.length

  const seen = new Set<string>()
  for (const row of rows) {
    const name = String(row.level ?? '').trim()
    if (!name || seen.has(name.toLowerCase())) {
      entry.skipped++
      entry.warnings.push(`level id=${row.id} vacío o duplicado; omitido`)
      continue
    }
    seen.add(name.toLowerCase())

    if (
      await write(
        target,
        `INSERT INTO levels (id, name, active) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [row.id, name, row.active ?? 1],
      )
    ) {
      entry.written++
    }
  }
}

/**
 * Envuelve la regla de `mapping.ts` para dejar constancia de los tipos que no
 * se reconocen. La regla vive allí porque está cubierta por tests.
 */
function roleFor(type: unknown, entry: StepReport, userId: unknown): 'developer' | 'lead' | 'admin' {
  const { role, recognized } = mapRoleRule(type)
  if (!recognized) {
    entry.warnings.push(`user id=${userId} con type="${String(type)}" desconocido; se asume developer`)
  }
  return role
}

/**
 * `users` → `users`.
 *
 * Resuelve posición y nivel a través de `user_position_level`: en v1,
 * `users.idPosition` NO apunta a `careers`, sino a la fila de
 * `user_position_level` que a su vez guarda idPosition e idLevel.
 *
 * Las contraseñas entran como 'md5-legacy'. MD5 no es reversible: el rehash a
 * bcrypt ocurre en el primer login correcto (Roadmap §6).
 */
async function migrateUsers(source: Connection, target: Connection): Promise<void> {
  const entry = step('users')

  const rows = await readRows<RowDataPacket>(
    source,
    `SELECT
       u.id, u.idUser, u.idLextracking, u.name, u.email, u.type,
       u.password, u.active, u.idPosition,
       upl.idPosition AS resolvedPosition,
       upl.idLevel    AS resolvedLevel
     FROM users u
     LEFT JOIN user_position_level upl ON upl.id = u.idPosition
     ORDER BY u.id`,
  )
  entry.read = rows.length

  const validPositions = new Set(
    (await readRows<RowDataPacket>(target, 'SELECT id FROM positions')).map((r) => r.id),
  )
  const validLevels = new Set(
    (await readRows<RowDataPacket>(target, 'SELECT id FROM levels')).map((r) => r.id),
  )

  const seenEmail = new Set<string>()
  const seenLextracking = new Set<number>()

  for (const row of rows) {
    const email = String(row.email ?? '').trim().toLowerCase()
    if (!email) {
      entry.skipped++
      entry.warnings.push(`user id=${row.id} sin email; omitido`)
      continue
    }
    if (seenEmail.has(email)) {
      entry.skipped++
      entry.warnings.push(`user id=${row.id} con email duplicado "${email}"; omitido`)
      continue
    }
    seenEmail.add(email)

    const password = String(row.password ?? '')
    if (!password) {
      entry.warnings.push(`user id=${row.id} sin contraseña; requerirá restablecimiento`)
    }

    // `lextracking_id` es UNIQUE en v2; en v1 podía repetirse o ser null.
    let lextrackingId: number | null = row.idLextracking ?? null
    if (lextrackingId !== null && seenLextracking.has(lextrackingId)) {
      entry.warnings.push(
        `user id=${row.id} repite lextracking_id=${lextrackingId}; se guarda como null`,
      )
      lextrackingId = null
    } else if (lextrackingId !== null) {
      seenLextracking.add(lextrackingId)
    }

    const positionId = validPositions.has(row.resolvedPosition) ? row.resolvedPosition : null
    const levelId = validLevels.has(row.resolvedLevel) ? row.resolvedLevel : null

    if (
      await write(
        target,
        `INSERT INTO users
           (id, lextracking_id, name, email, role, password_hash, password_algo,
            position_id, level_id, active)
         VALUES (?, ?, ?, ?, ?, ?, 'md5-legacy', ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [
          row.id,
          lextrackingId,
          String(row.name ?? '').trim() || email,
          email,
          roleFor(row.type, entry, row.id),
          password || '!',
          positionId,
          levelId,
          row.active ?? 1,
        ],
      )
    ) {
      entry.written++
    }
  }
}

/**
 * Relación lead → dev, desde el histórico `lead_dev_logs` (se toma la más
 * reciente por desarrollador). `idDev` guarda el identificador canónico del
 * desarrollador, que en v1 es COALESCE(idLextracking, id).
 */
async function migrateLeadRelations(source: Connection, target: Connection): Promise<void> {
  const entry = step('relación lead → dev')

  const rows = await readRows<RowDataPacket>(
    source,
    `SELECT l.idDev, l.idLead
     FROM lead_dev_logs l
     INNER JOIN (
       SELECT idDev, MAX(createdAt) AS latest
       FROM lead_dev_logs GROUP BY idDev
     ) last ON last.idDev = l.idDev AND last.latest = l.createdAt`,
  )
  entry.read = rows.length

  const legacyUsers = (
    await readRows<RowDataPacket>(source, 'SELECT id, idLextracking FROM users')
  ).map((u) => ({ id: Number(u.id), idLextracking: u.idLextracking ?? null }))
  const { index } = buildCanonicalIndex(legacyUsers)

  for (const row of rows) {
    const devId = resolveEvaluatedUser(row.idDev, index)
    const leadId = resolveEvaluatedUser(row.idLead, index) ?? Number(row.idLead)

    if (!devId) {
      entry.skipped++
      entry.warnings.push(`lead_dev_logs: idDev=${row.idDev} no corresponde a ningún usuario`)
      continue
    }
    if (devId === leadId) {
      entry.skipped++
      entry.warnings.push(`user id=${devId} figura como su propio lead; se omite`)
      continue
    }

    if (
      await write(
        target,
        `UPDATE users SET lead_id = ?
         WHERE id = ? AND EXISTS (SELECT 1 FROM (SELECT id FROM users) u WHERE u.id = ?)`,
        [leadId, devId, leadId],
      )
    ) {
      entry.written++
    }
  }
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log(DRY_RUN ? '\n=== MIGRACIÓN v1 → v2 (DRY-RUN, no se escribe nada) ===\n' : '\n=== MIGRACIÓN v1 → v2 ===\n')

  const source = await connectSource()
  const target = await connectTarget()

  try {
    await applySchema(target)
    await migratePositions(source, target)
    await migrateLevels(source, target)
    await migrateUsers(source, target)
    await migrateLeadRelations(source, target)
  } finally {
    await source.end()
    await target.end()
  }

  // --- informe ---
  log('\nPaso                                   Leídas  Escritas  Omitidas')
  log('─'.repeat(68))
  for (const entry of report) {
    log(
      `${entry.step.padEnd(38)} ${String(entry.read).padStart(6)} ${String(entry.written).padStart(9)} ${String(entry.skipped).padStart(9)}`,
    )
  }

  const warnings = report.flatMap((e) => e.warnings.map((w) => `  · [${e.step}] ${w}`))
  if (warnings.length) {
    log(`\n${warnings.length} avisos:`)
    warnings.forEach(log)
  }

  if (blockers.length) {
    log('\nBLOQUEANTES:')
    blockers.forEach((b) => log(`  · ${b}`))
  }

  const totalSkipped = report.reduce((sum, e) => sum + e.skipped, 0)
  log(
    DRY_RUN
      ? `\nDry-run terminado. ${totalSkipped} filas se omitirían. Revisa los avisos antes de ejecutar de verdad.`
      : `\nMigración terminada. ${totalSkipped} filas omitidas. Ejecuta \`npm run db:verify\` para contrastar los conteos.`,
  )

  if (blockers.length) process.exitCode = 1
}

main().catch((error: unknown) => {
  log(`\nLa migración falló: ${(error as Error).message}`)
  process.exitCode = 1
})
