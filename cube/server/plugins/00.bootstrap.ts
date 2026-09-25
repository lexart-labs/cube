/**
 * Arranque del servidor.
 *
 * Tres condiciones con tratamiento distinto a propósito:
 *
 * · **Configuración inválida → el proceso termina.** Es una condición de
 *   seguridad: no se sirve tráfico con secretos débiles o ausentes (HIGH-05).
 *
 * · **Base de datos inaccesible → se registra y se sigue.** Es una condición
 *   operativa. Salir del proceso convertiría un reinicio de MySQL de diez
 *   segundos en un crash-loop. El estado se expone en `/api/health`, que
 *   devuelve 503 mientras la base no responda.
 *
 * · **Base de datos vacía → se crea el esquema.** Idempotente, así que se
 *   ejecuta siempre: un despliegue contra una base recién creada funciona sin
 *   comandos manuales. Los datos de ejemplo, en cambio, exigen activación
 *   explícita porque llevan contraseñas conocidas.
 */
import { validateServerConfig } from '../utils/config'
import { initDatabase, ping, query } from '../db'
import { ensureSchema, countUsers, seedDemoData, seedSummary } from '../db/bootstrap'
import { logger } from '../utils/logger'
import { setDatabaseReady } from '../utils/health'

/** Ejecutor que enruta al pool ya inicializado. */
const executor = {
  query: async (sql: string, values?: unknown[]) => {
    const rows = await query(sql, (values ?? []) as never)
    return [rows, []] as [unknown, unknown]
  },
} as Parameters<typeof ensureSchema>[0]

export default defineNitroPlugin(async () => {
  let config

  try {
    config = validateServerConfig(useRuntimeConfig())
  } catch (error) {
    // El logger puede no estar listo todavía y este mensaje ya viene
    // formateado para que lo lea una persona.
    // eslint-disable-next-line no-console
    console.error(`\n${(error as Error).message}`)
    process.exit(1)
  }

  initDatabase(config.db)

  try {
    await ping()
    setDatabaseReady(true)
    logger.info('base de datos accesible')
  } catch (error) {
    setDatabaseReady(false)
    logger.error(
      { err: error },
      'la base de datos no responde; el servidor arranca y /api/health devolverá 503',
    )
    return
  }

  // --- esquema ---
  try {
    const statements = await ensureSchema(executor)
    logger.info({ statements }, 'esquema comprobado')
  } catch (error) {
    logger.error({ err: error }, 'no se pudo aplicar el esquema')
    setDatabaseReady(false)
    return
  }

  // --- datos de ejemplo ---
  await maybeSeed(config.seedOnStartup)

  logger.info('Cube arrancado')
})

/**
 * Crea los datos de ejemplo solo si se cumplen las dos condiciones.
 *
 * La bandera es lo que impide el accidente grave: sin ella, el primer arranque
 * de un despliegue real —donde la base también está vacía— crearía
 * `admin@cube.test` con una contraseña que está escrita en el repositorio.
 */
async function maybeSeed(enabled: boolean): Promise<void> {
  if (!enabled) return

  let users: number
  try {
    users = await countUsers(executor)
  } catch (error) {
    logger.error({ err: error }, 'no se pudo comprobar si la base está vacía')
    return
  }

  if (users > 0) {
    logger.info({ users }, 'la base ya tiene datos; no se siembra')
    return
  }

  if (process.env.NODE_ENV === 'production') {
    // No se bloquea —la bandera es una decisión explícita— pero tiene que
    // verse en los logs, porque casi siempre será un error de configuración.
    logger.warn(
      'NUXT_SEED_ON_STARTUP está activa con NODE_ENV=production: se van a crear ' +
        'cuentas con contraseña conocida. Desactívala si esto no es un entorno de pruebas.',
    )
  }

  try {
    await seedDemoData(executor)
    logger.info('base vacía: datos de ejemplo creados')
    for (const line of seedSummary()) {
      if (line) logger.info(line)
    }
  } catch (error) {
    // Que falle la semilla no debe impedir arrancar: la aplicación funciona,
    // simplemente sin datos de ejemplo.
    logger.error({ err: error }, 'no se pudieron crear los datos de ejemplo')
  }
}
