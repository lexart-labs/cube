/**
 * Reparaciones de esquema conocidas, aplicadas en el arranque.
 *
 * Resuelven el problema que `CREATE TABLE IF NOT EXISTS` no puede resolver: si
 * en la base ya hay una tabla con un nombre del esquema pero de otra versión,
 * el esquema no la toca y no se queja, y el fallo sale después en la primera
 * consulta (`Unknown column 'e.role_key'`). Con esto, `docker compose up`
 * deja una base heredada lista sin que nadie escriba SQL a mano.
 *
 * Tres reglas que hacen que esto sea seguro y que no conviene relajar:
 *
 * 1. **Solo se renombra. Nunca se borra ni se altera nada.** Lo que estorba se
 *    aparta con un nombre libre y sigue ahí, entero, para poder mirarlo o
 *    devolverlo (`RENAME TABLE evaluations_old TO evaluations`).
 *
 * 2. **Cada reparación es específica y nombra su tabla.** No existe una regla
 *    genérica del tipo "si una tabla no tiene la forma esperada, apártala":
 *    eso sería una máquina de perder datos. El día que alguien añada una
 *    columna a `users`, esa regla renombraría la tabla de usuarios entera y
 *    crearía una vacía — todas las cuentas fuera, en el arranque, sin que
 *    nadie lo pida. Lo que no esté enumerado aquí lo decide una persona, y
 *    mientras tanto la salvaguarda de `00.ready.ts` devuelve 503 en la parte
 *    afectada.
 *
 * 3. **Son idempotentes.** Cada una se aplica solo si su precondición se
 *    cumple, y después de aplicarla deja de cumplirse. El segundo arranque no
 *    hace nada.
 */

/** Estado de la base: tabla → columnas que tiene de verdad. */
export type SchemaShape = Map<string, Set<string>>

export interface Repair {
  /** Qué se hace, para el log. */
  description: string
  from: string
  to: string
}

/**
 * Catálogo de reparaciones.
 *
 * `when` mira el estado real de la base y `to` propone el nombre destino; si
 * está ocupado, `planRepairs` busca uno libre.
 */
const KNOWN_REPAIRS: ReadonlyArray<{
  description: string
  from: string
  to: string
  when: (shape: SchemaShape) => boolean
}> = [
  {
    /**
     * La `evaluations` del modelo de 27 indicadores, que ocupaba ese nombre en
     * v1 y en v2 hasta la revisión de AD-05 (2026-09-25). Se reconoce porque
     * existe y no tiene `role_key`, que es la columna que define el modelo
     * vigente. Su histórico sigue además en la base de v1 y en su backup.
     */
    description: 'la tabla `evaluations` del modelo de 27 indicadores se aparta',
    from: 'evaluations',
    to: 'evaluations_old',
    when: (shape) => {
      const columns = shape.get('evaluations')
      return columns !== undefined && !columns.has('role_key')
    },
  },
  {
    /**
     * El renombrado del 2026-09-27: al retirarse el nombre IDEAL, la tabla
     * pasó a llamarse `evaluations`. Se mueve con sus datos dentro, y solo
     * cuando el nombre destino está libre — si la anterior sigue ahí, la
     * reparación de arriba la aparta primero en este mismo arranque.
     */
    description: 'las evaluaciones guardadas se mueven de `ideal_evaluations` a `evaluations`',
    from: 'ideal_evaluations',
    to: 'evaluations',
    when: (shape) => shape.has('ideal_evaluations') && !shape.has('evaluations'),
  },
]

/**
 * Primer nombre libre a partir de `base`: `base`, `base_2`, `base_3`…
 *
 * Existe para no pisar una tabla apartada en un arranque anterior. Perder lo
 * que se apartó "para poder mirarlo luego" sería justo lo contrario de lo que
 * busca este módulo.
 */
export function freeName(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base
  for (let suffix = 2; suffix < 100; suffix++) {
    const candidate = `${base}_${suffix}`
    if (!taken.has(candidate)) return candidate
  }
  throw new Error(`No hay un nombre libre para ${base}`)
}

/**
 * Qué hay que renombrar, dado el estado de la base.
 *
 * Puro a propósito: decidir es lo que hay que poder probar sin MySQL
 * (`tests/unit/repairs.test.ts`). Las reparaciones se evalúan en orden y cada
 * una ve el efecto de la anterior, que es lo que permite que apartar la vieja
 * `evaluations` deje sitio a `ideal_evaluations` en el mismo arranque.
 */
export function planRepairs(shape: SchemaShape): Repair[] {
  // Copia de trabajo: se va actualizando para que cada reparación vea la base
  // como quedará, no como estaba.
  const current: SchemaShape = new Map([...shape].map(([table, cols]) => [table, new Set(cols)]))
  const plan: Repair[] = []

  for (const repair of KNOWN_REPAIRS) {
    if (!repair.when(current)) continue

    const to = freeName(repair.to, new Set(current.keys()))
    plan.push({ description: repair.description, from: repair.from, to })

    const columns = current.get(repair.from) ?? new Set<string>()
    current.delete(repair.from)
    current.set(to, columns)
  }

  return plan
}
