/**
 * Validación en la frontera.
 *
 * Cierra la mitad de CRIT-04 de Security.md. La otra mitad son los parámetros
 * vinculados de `server/db`; esta es la que impide que un valor con forma
 * inesperada llegue siquiera a la capa de datos.
 *
 * En v1 no había validación: `req.query.query` iba directo a una plantilla de
 * cadena dentro del SQL (`courses.service.js:10`), y `page` se interpolaba sin
 * comprobar que fuera un número (`courses.service.js:16`).
 *
 * Regla: todo `body`, `query` y `params` pasa por un esquema. Sin excepciones.
 */
import { readBody, getQuery, getRouterParams, type H3Event } from 'h3'
import { z } from 'zod'
import { badRequest } from './errors'

/** Convierte los errores de Zod en un mensaje legible y sin detalles internos. */
function describe(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}

export async function validatedBody<T extends z.ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const body = await readBody(event).catch(() => undefined)
  const result = schema.safeParse(body)
  if (!result.success) throw badRequest(describe(result.error))
  return result.data
}

export function validatedQuery<T extends z.ZodType>(event: H3Event, schema: T): z.infer<T> {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) throw badRequest(describe(result.error))
  return result.data
}

export function validatedParams<T extends z.ZodType>(event: H3Event, schema: T): z.infer<T> {
  const result = schema.safeParse(getRouterParams(event))
  if (!result.success) throw badRequest(describe(result.error))
  return result.data
}

// ---------------------------------------------------------------------------
// Esquemas reutilizables
// ---------------------------------------------------------------------------

/** Identificador de recurso en la ruta. */
export const idParam = z.object({
  id: z.coerce.number().int().positive(),
})

/**
 * Paginación con techo.
 *
 * `limit` está acotado a 100: sin tope, un `?limit=1000000` es una denegación
 * de servicio trivial contra la base.
 */
export const pagination = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Texto de búsqueda. Se limita la longitud y se recorta.
 *
 * No hace falta escapar nada: el valor viaja como parámetro vinculado. Escapar
 * aquí daría una falsa sensación de seguridad y rompería búsquedas legítimas
 * que contengan comillas.
 */
export const searchQuery = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => (value === '' ? undefined : value))

/**
 * Construye un `ORDER BY` seguro a partir de una allow-list.
 *
 * SQL no permite parametrizar nombres de columna, así que la única defensa es
 * no aceptar nunca la entrada del usuario tal cual. Devuelve un fragmento
 * construido exclusivamente con valores del propio código.
 */
export function safeOrderBy<T extends Record<string, string>>(
  allowed: T,
  requested: unknown,
  fallback: keyof T,
  direction: unknown = 'asc',
): string {
  const key = typeof requested === 'string' && requested in allowed ? requested : String(fallback)
  const column = allowed[key as keyof T]
  const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
  return `${column} ${dir}`
}

/** Contraseña de usuario final. No se exige composición, sí longitud. */
export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(200, 'La contraseña es demasiado larga')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('El email no es válido')
  .max(191)
