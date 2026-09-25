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
