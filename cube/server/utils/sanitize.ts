/**
 * Saneado de texto libre.
 *
 * Cierra MED-02 de Security.md de raíz, no con un parche. v1 guardaba las
 * observaciones como HTML y las pintaba con `v-html`, así que dependía de que
 * DOMPurify estuviera bien puesto en cada uno de los tres sitios donde se
 * renderizaba — y en `ext/onboarding/components/ComplianceStep.vue:162` no lo
 * estaba.
 *
 * v2 guarda texto plano. Los saltos de línea se conservan y el frontend los
 * muestra con `white-space: pre-wrap`, sin `v-html` en ninguna parte. Una clase
 * entera de XSS deja de existir en lugar de quedar mitigada.
 */

const HTML_TAG = /<[^>]*>/g
const HTML_COMMENT = /<!--[\s\S]*?-->/g

/** Caracteres de control, salvo tabulador (\x09) y salto de línea (\x0A). */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/**
 * Convierte HTML en texto plano legible.
 * `<br>` y `</p>` pasan a salto de línea para no juntar párrafos al migrar
 * observaciones que v1 guardó como HTML.
 */
export function htmlToText(input: string): string {
  return input
    .replace(HTML_COMMENT, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(HTML_TAG, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // `&amp;` se resuelve al final para no recrear entidades por accidente:
    // "&amp;lt;" debe quedar en "&lt;", no en "<".
    .replace(/&amp;/gi, '&')
}

/**
 * Normaliza un texto libre para guardarlo.
 * Quita marcado, recorta y colapsa los saltos de línea excesivos.
 * Devuelve `null` si no queda contenido.
 */
export function sanitizeText(input: unknown, maxLength = 5000): string | null {
  if (typeof input !== 'string') return null

  const text = htmlToText(input)
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!text) return null
  return text.slice(0, maxLength)
}
