/**
 * Cadena de mando: quién reporta a quién.
 *
 * Existe por una razón concreta. Hasta ahora el lead de una persona solo se
 * fijaba al crearla o por API, y nadie lo cambiaba; desde que se puede editar
 * en `/admin/users` es cuestión de tiempo que alguien deje a Ana reportando a
 * Bruno y a Bruno reportando a Ana. Hoy nada recorre la cadena —el listado
 * hace un único LEFT JOIN— así que el ciclo no rompería ninguna pantalla:
 * simplemente quedaría guardado un organigrama que no significa nada, y lo
 * descubriría el primer informe que intente subir por él.
 *
 * La comprobación va en JS y no en un CTE recursivo de MySQL a propósito: un
 * `WITH RECURSIVE` sobre datos ya ciclados gira hasta `cte_max_recursion_depth`
 * y revienta con un error del motor, que el cliente vería como un 500 sin
 * explicación. Un bucle con tope dice exactamente qué pasa.
 */

/** Tope de saltos. Una jerarquía real no pasa de cinco; veinte es holgura. */
export const MAX_LEAD_DEPTH = 20

/**
 * ¿Asignarle `newLeadId` a `userId` cerraría un ciclo?
 *
 * Se sube por la cadena desde el lead propuesto: si en el camino aparece la
 * propia persona, el ciclo está servido. Recibe el lector de la base como
 * parámetro para poder probarlo sin base (`tests/unit/orgchart.test.ts`).
 *
 * También devuelve `true` si la cadena ya es más profunda que `MAX_LEAD_DEPTH`,
 * que en la práctica significa que ya estaba ciclada antes de este cambio.
 */
export async function wouldCreateLeadCycle(
  leadOf: (userId: number) => Promise<number | null>,
  userId: number,
  newLeadId: number,
): Promise<boolean> {
  if (userId === newLeadId) return true

  let current: number | null = newLeadId
  for (let hops = 0; hops < MAX_LEAD_DEPTH; hops++) {
    if (current === null) return false
    if (current === userId) return true
    current = await leadOf(current)
  }

  // Se agotaron los saltos sin llegar a la raíz: o la cadena es absurda o ya
  // estaba ciclada. En cualquiera de los dos casos, no se añade un eslabón más.
  return true
}
