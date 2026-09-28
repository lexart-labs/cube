/**
 * Estado de disponibilidad del proceso.
 *
 * Separa "el proceso vive" de "el proceso puede atender peticiones". El
 * arranque no aborta cuando la base no responde (ver `plugins/00.bootstrap.ts`),
 * así que hace falta un sitio donde consultar si realmente está listo.
 */
let databaseReady = false

export function setDatabaseReady(ready: boolean): void {
  databaseReady = ready
}

export function isDatabaseReady(): boolean {
  return databaseReady
}

/**
 * Esquema roto: una o más tablas existen con un nombre del esquema pero sin
 * las columnas que declara (ver `verifySchemaShape`).
 *
 * Se guarda aparte de `databaseReady` por una diferencia que importa: que la
 * base no responda es **transitorio** —vuelve sola y `/api/health` lo detecta
 * al repasar— mientras que una tabla con la forma equivocada no se arregla
 * esperando. Requiere que alguien toque la base y reinicie, así que este
 * estado no se limpia solo; si lo hiciera, el primer sondeo de salud
 * devolvería la aplicación a servir 500 en cada pantalla.
 *
 * El detalle vive aquí solo para el log. Al cliente se le responde 503 sin
 * nombres de tablas ni de columnas: eso es reconocimiento gratuito (HIGH-07).
 */
interface SchemaProblem {
  detail: string
  tables: string[]
}

let schemaProblem: SchemaProblem | null = null

export function setSchemaProblem(problem: SchemaProblem | null): void {
  schemaProblem = problem
}

export function getSchemaProblem(): SchemaProblem | null {
  return schemaProblem
}

/**
 * Qué parte de la API deja de poder atenderse con esas tablas rotas.
 *
 * Mapa explícito y a propósito. La primera versión de esta salvaguarda cortaba
 * la API ENTERA ante cualquier desajuste, y con una tabla `evaluations` mal
 * formada dejaba a la gente sin poder ni iniciar sesión — convertía una
 * pantalla rota en una aplicación inservible, que es peor que el problema que
 * venía a resolver. Se corta lo que de verdad depende de la tabla y nada más.
 *
 * Una tabla que no esté aquí no bloquea nada: esto es un control de
 * disponibilidad, no de seguridad, así que ante la duda se sirve. El arranque
 * la nombra igualmente en el log.
 */
const ROUTES_BY_TABLE: Record<string, readonly string[]> = {
  users: ['/api/auth', '/api/users', '/api/evaluations', '/api/external'],
  sessions: ['/api/auth'],
  evaluations: ['/api/evaluations'],
  positions: ['/api/positions'],
  levels: ['/api/levels'],
  api_keys: ['/api/api-keys', '/api/external'],
  api_key_allowlist: ['/api/api-keys', '/api/external'],
  // La auditoría nunca tumba la operación que audita (ver `audit()`), así que
  // tenerla rota es feo pero no impide servir nada.
  audit_log: [],
}

export function routesAffectedBy(tables: readonly string[]): string[] {
  const prefixes = new Set<string>()
  for (const table of tables) {
    for (const prefix of ROUTES_BY_TABLE[table] ?? []) prefixes.add(prefix)
  }
  return [...prefixes].sort()
}
