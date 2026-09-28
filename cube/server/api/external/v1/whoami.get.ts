/**
 * Comprobación de la clave. `GET /api/external/v1/whoami`.
 *
 * No hace nada y por eso es el endpoint más útil de los dos: devuelve **la IP
 * y el origen que el servidor ha visto de verdad**, que es lo único que falta
 * para configurar una lista de acceso sin ir a ciegas. Detrás de un proxy, la
 * IP que cree tener quien llama y la que llega casi nunca son la misma, y sin
 * una forma de verlo la lista se rellena a base de prueba y error hasta que
 * alguien escribe `0.0.0.0/0` y se acabó el control de acceso.
 *
 * No exige ningún permiso: para llegar hasta aquí ya ha habido que superar la
 * clave y la lista, y lo que devuelve es lo que quien llama acaba de mandar.
 */
import { defineEventHandler } from 'h3'
import { requireApiKey } from '../../../utils/apikey'

export default defineEventHandler((event) => {
  const client = requireApiKey(event)

  return {
    name: client.name,
    prefix: client.prefix,
    scopes: client.scopes,
    /** Lo que el servidor ve. Es lo que tiene que estar en la lista. */
    seenFrom: {
      ip: client.ip,
      origin: client.originHost,
    },
  }
})
