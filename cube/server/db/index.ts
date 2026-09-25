/**
 * Capa de acceso a datos.
 *
 * Cierra dos hallazgos de Security.md:
 *
 * - HIGH-06: `backend/config/conn.js:22-28` hacía `resolve(error)` en lugar de
 *   `reject`, así que un fallo de SQL llegaba a la lógica de negocio *como si
 *   fuera el resultado*. Por eso v1 comprueba `response.length > 0` en vez de
 *   usar try/catch, y por eso abundan los `catch(e){}` vacíos: nunca se
 *   disparaban. Aquí los errores se propagan.
 *
 * - MED-08: v1 usaba `createConnection` (una sola conexión, punto único de
 *   fallo) y sin TLS. Aquí hay pool y TLS configurable.
 *
 * Además `execute()` fuerza sentencias preparadas del lado del servidor y
 * `multipleStatements: false` impide apilar consultas, que es la escalada
 * habitual de una inyección (CRIT-04).
 */
import mysql from 'mysql2/promise'
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { scopedLogger } from '../utils/logger'
import type { ServerConfig } from '../utils/config'

const log = scopedLogger('db')

let pool: Pool | null = null

/**
 * Error de base de datos que ya ha sido registrado con su detalle.
 * Lo que se propaga hacia arriba no lleva el mensaje de MySQL: HIGH-07 exige
 * que `sqlMessage` nunca cruce el límite hacia el cliente.
 */
export class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'DatabaseError'
  }
}

/**
 * Valor vinculable en una consulta.
 *
 * Más estricto a propósito que el `ExecuteValues` de mysql2, que admite objetos
 * y arrays anidados: aquí solo entran escalares, de modo que no se puede pasar
 * un objeto entero como parámetro por descuido.
 */
export type QueryParam = string | number | bigint | boolean | Date | Buffer | null

/** Crea el pool. Se llama una sola vez desde el plugin de arranque. */
export function initDatabase(config: ServerConfig['db']): Pool {
  if (pool) return pool

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.name,

    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    queueLimit: 0,
    enableKeepAlive: true,
    connectTimeout: 10_000,

    // Controles de seguridad, no de rendimiento:
    // sin sentencias apiladas, una inyección no puede encadenar un segundo comando.
    multipleStatements: false,
    // Las fechas se manejan como string para no depender de la zona horaria del proceso.
    dateStrings: true,

    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
  })

  log.info(
    { host: config.host, port: config.port, database: config.name, ssl: config.ssl },
    'pool de base de datos creado',
  )

  return pool
}

/** Devuelve el pool ya inicializado, o falla si se usa antes de arrancar. */
function getPool(): Pool {
  if (!pool) {
    throw new DatabaseError(
      'La base de datos no está inicializada. initDatabase() debe correr en el arranque.',
    )
  }
  return pool
}

/**
 * Recorta el SQL para el log. Nunca se registran los parámetros: pueden
 * contener contraseñas, IBAN o documentos de identidad (HIGH-08, HIGH-10).
 */
function sqlForLog(sql: string): string {
  const flat = sql.replace(/\s+/g, ' ').trim()
  return flat.length > 200 ? `${flat.slice(0, 200)}…` : flat
}

/**
 * Ejecuta un SELECT y devuelve las filas.
 *
 * `params` son siempre valores vinculados. Los fragmentos que SQL no permite
 * parametrizar (nombres de columna, ORDER BY) NO se concatenan aquí: se
 * resuelven contra una allow-list antes de llamar a esta función.
 */
export async function query<T = RowDataPacket>(sql: string, params: QueryParam[] = []): Promise<T[]> {
  const startedAt = Date.now()
  try {
    const [rows] = await getPool().execute(sql, params)
    return rows as T[]
  } catch (cause) {
    log.error(
      { err: cause, sql: sqlForLog(sql), paramCount: params.length, ms: Date.now() - startedAt },
      'consulta fallida',
    )
    throw new DatabaseError('La consulta a la base de datos falló', { cause })
  }
}

/** Ejecuta un SELECT que devuelve como mucho una fila. */
export async function queryOne<T = RowDataPacket>(
  sql: string,
  params: QueryParam[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/** Ejecuta un INSERT/UPDATE/DELETE y devuelve el resultado con filas afectadas. */
export async function execute(sql: string, params: QueryParam[] = []): Promise<ResultSetHeader> {
  const startedAt = Date.now()
  try {
    const [result] = await getPool().execute(sql, params)
    return result as ResultSetHeader
  } catch (cause) {
    log.error(
      { err: cause, sql: sqlForLog(sql), paramCount: params.length, ms: Date.now() - startedAt },
      'sentencia fallida',
    )
    throw new DatabaseError('La operación en la base de datos falló', { cause })
  }
}

/**
 * Ejecuta una función dentro de una transacción, con commit o rollback.
 * Para las operaciones que tocan varias tablas y deben cuadrar o no ocurrir.
 */
export async function transaction<T>(
  fn: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await fn(connection)
    await connection.commit()
    return result
  } catch (cause) {
    await connection.rollback()
    log.error({ err: cause }, 'transacción revertida')
    throw cause instanceof DatabaseError
      ? cause
      : new DatabaseError('La transacción falló', { cause })
  } finally {
    connection.release()
  }
}

/** Comprueba que la base responde. Se usa en el arranque y en el healthcheck. */
export async function ping(): Promise<void> {
  const connection = await getPool().getConnection()
  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}

/** Cierra el pool. Para el apagado ordenado y para los tests. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    log.info('pool de base de datos cerrado')
  }
}
