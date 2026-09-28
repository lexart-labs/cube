/**
 * Esquemas compartidos de la administración de claves de API.
 *
 * La validación de las entradas de la lista de acceso está aquí y no repartida
 * entre el alta y la edición: una IP mal escrita que se guarde tal cual no
 * falla en el momento, falla el día que alguien confía en que esa entrada
 * protege algo.
 */
import { z } from 'zod'
import { API_SCOPES } from '../../utils/apikey'
import { isValidDomainPattern, isValidIpPattern } from '../../utils/netmatch'

/**
 * Una entrada de la lista de acceso.
 *
 * `pattern` se valida según el canal, con mensajes que dicen qué se esperaba:
 * el error más habitual es pegar `https://app.lexart.tech/` en la casilla de
 * dominio, y "no es válido" a secas no ayuda a nadie.
 */
export const allowlistEntrySchema = z
  .object({
    kind: z.enum(['ip', 'domain']),
    pattern: z.string().trim().min(1).max(191),
    note: z.string().trim().max(191).optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.kind === 'ip') {
      if (!isValidIpPattern(entry.pattern)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pattern'],
          message: `«${entry.pattern}» no es una IP ni un rango CIDR. Ejemplos: 203.0.113.10, 10.0.0.0/8, 127.0.0.1, ::1`,
        })
      }
      return
    }

    if (!isValidDomainPattern(entry.pattern)) {
      ctx.addIssue({
        code: 'custom',
        path: ['pattern'],
        message: `«${entry.pattern}» no es un dominio. Se espera solo el host, sin esquema ni puerto ni barra: localhost, app.lexart.tech, *.lexart.tech`,
      })
    }
  })

/**
 * Lista completa. Se sustituye entera en cada guardado, así que el tope existe
 * para que nadie pueda dejar una lista imposible de revisar.
 */
export const allowlistSchema = z.array(allowlistEntrySchema).max(50)

/** Permisos. Vacío es válido y significa "se autentica, pero no puede nada". */
export const scopesSchema = z.array(z.enum(API_SCOPES)).max(API_SCOPES.length)

/**
 * Caducidad opcional, en formato AAAA-MM-DD como el resto de fechas de Cube.
 * `null` la quita; omitirlo la deja como esté.
 */
export const expiresAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'La fecha no es válida',
  })

/**
 * Convierte la fecha a lo que se guarda.
 *
 * Se guarda el final del día indicado: quien escribe «caduca el 31 de
 * diciembre» espera poder usarla ese día, no que deje de valer a medianoche
 * del 30.
 */
export function endOfDay(date: string): string {
  return `${date} 23:59:59`
}

/** Filas de la lista de acceso tal como se devuelven al cliente. */
export interface AllowlistRow {
  id: number
  api_key_id: number
  kind: 'ip' | 'domain'
  pattern: string
  note: string | null
}
