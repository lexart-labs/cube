/**
 * Reglas de traducción de v1 a v2.
 *
 * Están aquí, separadas del runner, porque son las decisiones que pueden
 * corromper datos de forma silenciosa — y así se pueden probar sin una base de
 * datos delante. El SQL de `migrate.ts` es fontanería; esto es criterio.
 */

/** Fila de `users` de v1, con lo que hace falta para resolver identidades. */
export interface LegacyUser {
  id: number
  idLextracking: number | null
}

/**
 * Traduce `users.type` (texto libre en v1) al enum `role` de v2.
 * Devuelve también si el valor era reconocido, para poder avisar.
 */
export function mapRole(type: unknown): {
  role: 'developer' | 'lead' | 'admin'
  recognized: boolean
} {
  const value = String(type ?? '')
    .trim()
    .toLowerCase()

  if (value === 'admin') return { role: 'admin', recognized: true }
  if (value === 'lead' || value === 'pm' || value === 'manager') {
    return { role: 'lead', recognized: true }
  }
  if (value === 'developer' || value === 'dev' || value === '') {
    return { role: 'developer', recognized: true }
  }
  return { role: 'developer', recognized: false }
}

/**
 * Construye el índice del identificador canónico de desarrollador.
 *
 * En v1 el identificador por el que se relacionan evaluaciones y skills es
 * `COALESCE(idLextracking, id)` — el fallback está literalmente en
 * `backend/services/users.service.js:288`. Es la parte más delicada de toda la
 * migración: equivocarse aquí asigna evaluaciones a la persona equivocada.
 *
 * Devuelve el mapa y la lista de claves ambiguas, es decir, aquellas en las que
 * el identificador de un usuario coincide con el de otro (por ejemplo, el `id`
 * de uno igual al `idLextracking` de otro).
 */
export function buildCanonicalIndex(users: LegacyUser[]): {
  index: Map<number, number>
  ambiguous: number[]
} {
  const index = new Map<number, number>()
  const ambiguous = new Set<number>()

  for (const user of users) {
    const key = user.idLextracking ?? user.id
    const existing = index.get(key)
    if (existing !== undefined && existing !== user.id) {
      ambiguous.add(key)
    }
    index.set(key, user.id)
  }

  return { index, ambiguous: [...ambiguous] }
}

/**
 * Resuelve a qué usuario de v2 corresponde el `idLextracking` de una evaluación.
 * `null` significa huérfana: no debe migrarse en silencio, sino informarse.
 */
export function resolveEvaluatedUser(
  legacyIdLextracking: unknown,
  index: Map<number, number>,
): number | null {
  const key = Number(legacyIdLextracking)
  if (!Number.isInteger(key)) return null
  return index.get(key) ?? null
}
