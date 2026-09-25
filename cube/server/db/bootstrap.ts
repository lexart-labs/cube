/**
 * Preparación de la base de datos.
 *
 * Dos operaciones con riesgos muy distintos, y por eso separadas:
 *
 * · `ensureSchema()` — crea las tablas que falten. Idempotente y seguro: se
 *   ejecuta SIEMPRE al arrancar, para que un despliegue contra una base vacía
 *   funcione sin comandos manuales.
 *
 * · `seedDemoData()` — crea cuentas con **contraseña conocida**. Ejecutarla en
 *   producción sería regalar una cuenta de administrador. Exige activación
 *   explícita y que la base no tenga ni un usuario.
 */
import type { Connection, Pool, RowDataPacket } from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { schemaStatements } from './schema.ts'
import { IDEAL_ROLES, scorePercent, weightedAverage } from '../../shared/ideal.ts'
import type { IdealScores } from '../../shared/ideal.ts'

type Executor = Pick<Connection | Pool, 'query'>

/** Contraseña de las cuentas de ejemplo. Solo desarrollo. */
export const SEED_PASSWORD = 'cube-demo-2026!'

/**
 * Aplica el esquema. Todas las sentencias son `CREATE TABLE IF NOT EXISTS`, así
 * que volver a ejecutarlo sobre una base ya creada no cambia nada.
 *
 * Se ejecutan de una en una porque el pool tiene `multipleStatements: false`
 * como control de seguridad, y no conviene abrir esa puerta ni siquiera aquí.
 */
export async function ensureSchema(executor: Executor): Promise<number> {
  const statements = schemaStatements()
  for (const statement of statements) {
    await executor.query(statement)
  }
  return statements.length
}

/** Número de usuarios. Es lo que decide si la base está "vacía". */
export async function countUsers(executor: Executor): Promise<number> {
  const [rows] = await executor.query('SELECT COUNT(*) AS total FROM users')
  return Number((rows as RowDataPacket[])[0]?.total ?? 0)
}

/**
 * Notas deterministas para la semilla: los tests E2E comparan promedios
 * exactos, así que no puede haber azar aquí. El bloque de idiomas tiene escala
 * cerrada 1/3/5 y no admite el mismo tratamiento que el resto.
 */
function buildScores(roleKey: string, base: number, offset: number): IdealScores {
  const role = IDEAL_ROLES[roleKey]
  if (!role) throw new Error(`Rol IDEAL desconocido en la semilla: ${roleKey}`)

  const scores: IdealScores = {}
  let index = 0
  for (const block of role.blocks) {
    scores[block.key] = block.questions.map(() => {
      if (block.scale === 'languages') return 3
      const variation = ((index++ + offset) % 3) - 1
      return Math.min(5, Math.max(1, base + variation))
    })
  }
  return scores
}

/**
 * Crea los datos de ejemplo. NO comprueba si es seguro hacerlo: esa decisión
 * corresponde a quien la llama (`maybeSeedOnStartup` o el script CLI).
 */
export async function seedDemoData(executor: Executor): Promise<void> {
  const hash = await bcrypt.hash(SEED_PASSWORD, 12)

  await executor.query(
    `INSERT INTO positions (id, name, minimum_time_months, active) VALUES
       (1, 'Frontend Developer L1', 12, 1),
       (2, 'Frontend Developer L2', 18, 1),
       (3, 'FullStack Developer L1', 12, 1),
       (4, 'Tech Lead', 24, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
  )
  await executor.query(
    `INSERT INTO levels (id, name, active) VALUES
       (1, 'Junior', 1), (2, 'Semi Senior', 1), (3, 'Senior', 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
  )

  await executor.query(
    `INSERT INTO users (id, name, email, role, password_hash, password_algo, position_id, level_id, active) VALUES
       (1, 'Ana Admin',  'admin@cube.test', 'admin',     ?, 'bcrypt', 4, 3, 1),
       (2, 'Luis Lead',  'lead@cube.test',  'lead',      ?, 'bcrypt', 4, 3, 1),
       (3, 'Dana Dev',   'dev@cube.test',   'developer', ?, 'bcrypt', 3, 2, 1),
       (4, 'Bruno Dev',  'dev2@cube.test',  'developer', ?, 'bcrypt', 1, 1, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [hash, hash, hash, hash],
  )
  await executor.query('UPDATE users SET lead_id = 2 WHERE id IN (3, 4)')

  // Cuenta con contraseña MD5, para poder probar el rehash transparente
  // (Roadmap §6) tal como llegarán los usuarios migrados de v1.
  await executor.query(
    `INSERT INTO users (id, name, email, role, password_hash, password_algo, active) VALUES
       (5, 'Vera Legacy', 'legacy@cube.test', 'developer', ?, 'md5-legacy', 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [createHash('md5').update(SEED_PASSWORD, 'utf8').digest('hex')],
  )

  const evaluations = [
    { id: 1, user: 3, date: '2025-03-15', role: 'desarrollador-l3', base: 3, offset: 0 },
    { id: 2, user: 3, date: '2025-09-15', role: 'desarrollador-l3', base: 4, offset: 1 },
    { id: 3, user: 3, date: '2026-03-15', role: 'desarrollador-l3', base: 4, offset: 2 },
    { id: 4, user: 4, date: '2026-02-01', role: 'desarrollador-l3', base: 3, offset: 1 },
  ]

  for (const item of evaluations) {
    const scores = buildScores(item.role, item.base, item.offset)
    const average = weightedAverage(item.role, scores)
    await executor.query(
      `INSERT INTO ideal_evaluations
         (id, author_user_id, evaluated_user_id, role_key, evaluated_on, scores,
          weighted_average, score_percent, observations, active)
       VALUES (?, 2, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE evaluated_on = VALUES(evaluated_on)`,
      [
        item.id,
        item.user,
        item.role,
        item.date,
        JSON.stringify(scores),
        average,
        scorePercent(average),
        'Buen trimestre.\nSigue trabajando la comunicación con cliente.',
      ],
    )
  }
}

/** Resumen legible de las cuentas creadas. */
export function seedSummary(): string[] {
  return [
    'Cuentas de ejemplo (todas con la misma contraseña):',
    `  admin@cube.test    ${SEED_PASSWORD}   admin`,
    `  lead@cube.test     ${SEED_PASSWORD}   lead`,
    `  dev@cube.test      ${SEED_PASSWORD}   developer, con 3 evaluaciones`,
    `  dev2@cube.test     ${SEED_PASSWORD}   developer, con 1 evaluación`,
    `  legacy@cube.test   ${SEED_PASSWORD}   contraseña MD5, para probar el rehash`,
  ]
}
