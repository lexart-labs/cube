/**
 * v2 no guarda HTML en texto libre. Eso elimina la clase de XSS de MED-02 en
 * vez de mitigarla: si en la base no hay marcado, el frontend nunca necesita
 * `v-html`.
 */
import { describe, it, expect } from 'vitest'
import { sanitizeText, htmlToText } from '../../server/utils/sanitize'

describe('sanitizeText', () => {
  it('elimina el script del payload clásico de XSS', () => {
    expect(sanitizeText('<script>alert(1)</script>Buen trabajo')).toBe('alert(1)Buen trabajo')
  })

  it('elimina atributos de evento junto con la etiqueta', () => {
    expect(sanitizeText('<img src=x onerror="alert(1)">texto')).toBe('texto')
  })

  it('no deja ningún signo de menor ni mayor de marcado', () => {
    const result = sanitizeText('<b>hola</b> <i>mundo</i>')
    expect(result).not.toMatch(/<[a-z/]/i)
  })

  it('conserva los saltos de línea de <br> y </p>', () => {
    expect(sanitizeText('linea1<br>linea2')).toBe('linea1\nlinea2')
    expect(sanitizeText('<p>uno</p><p>dos</p>')).toBe('uno\n\ndos')
  })

  it('resuelve &amp; al final, sin recrear entidades', () => {
    // "&amp;lt;" debe quedar en "&lt;" literal, no convertirse en "<".
    expect(htmlToText('&amp;lt;')).toBe('&lt;')
  })

  it('conserva acentos y eñes', () => {
    expect(sanitizeText('Evaluación de desempeño: cumplió')).toBe(
      'Evaluación de desempeño: cumplió',
    )
  })

  it('colapsa los saltos de línea excesivos', () => {
    expect(sanitizeText('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  it('elimina caracteres de control pero mantiene tabulador y salto', () => {
    // \u0007 (campana) y \u0000 (nulo) se eliminan; \t y \n se conservan.
    expect(sanitizeText('a\u0007b\u0000c\td\ne')).toBe('abc\td\ne')
  })

  it('devuelve null cuando no queda contenido', () => {
    expect(sanitizeText('<div></div>')).toBeNull()
    expect(sanitizeText('    ')).toBeNull()
    expect(sanitizeText(null)).toBeNull()
    expect(sanitizeText(123)).toBeNull()
  })

  it('recorta a la longitud máxima', () => {
    expect(sanitizeText('x'.repeat(200), 50)).toHaveLength(50)
  })
})
