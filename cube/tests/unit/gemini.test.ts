/**
 * Redacción con IA: pseudonimización, prompt y respuesta.
 *
 * Todo con un cliente falso: ni una llamada a la red. Lo que se prueba aquí no
 * es que Gemini escriba bien —eso no es comprobable— sino la garantía que
 * sostiene la decisión de usarlo: **el nombre de la persona no sale de Lexart**.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  NAME_TOKEN,
  NarrativeError,
  SYSTEM_PROMPT,
  applyName,
  buildUserPrompt,
  generateNarrative,
  isAiConfigured,
  parseNarrative,
  scrubName,
  type NarrativePromptData,
} from '../../server/utils/gemini'

const DATA: NarrativePromptData = {
  roleLabel: 'Arquitecto L2',
  average: 3.7,
  blocks: [
    { label: 'Hard Skills', weight: 40, average: 4, scores: [4, 4, 4, 4, 4] },
    { label: 'Liderazgo', weight: 30, average: 3, scores: [3, 3, 3, 3, 3] },
    { label: 'Comercial', weight: 20, average: 4, scores: [4, 4, 4] },
    { label: 'Idiomas', weight: 10, average: 3, scores: [3] },
  ],
  languageScore: 3,
  observations: 'Ha crecido mucho este semestre.',
}

describe('prompt', () => {
  it('no contiene el nombre de la persona, sino el testigo', () => {
    const prompt = buildUserPrompt(DATA)
    expect(prompt).toContain(NAME_TOKEN)
    expect(prompt).not.toContain('Marina')
    expect(prompt).toContain('Arquitecto L2')
    expect(prompt).toContain('3.70')
  })

  it('lleva cada bloque con su peso y sus notas', () => {
    const prompt = buildUserPrompt(DATA)
    expect(prompt).toContain('Hard Skills (peso 40%, media 4.00): [4, 4, 4, 4, 4]')
    expect(prompt).toContain('Nota de idiomas: 3')
  })

  it('dice explícitamente "sin observaciones" en vez de dejar el hueco', () => {
    expect(buildUserPrompt({ ...DATA, observations: '   ' })).toContain('sin observaciones')
    expect(buildUserPrompt({ ...DATA, observations: null })).toContain('sin observaciones')
  })

  it('el system prompt pide el testigo y JSON', () => {
    expect(SYSTEM_PROMPT).toContain(NAME_TOKEN)
    expect(SYSTEM_PROMPT).toContain('JSON')
  })
})

describe('pseudonimización', () => {
  it('borra el nombre completo y cada parte del texto libre', () => {
    const scrubbed = scrubName(
      'Marina Pérez ha crecido mucho. Marina lidera bien y a Pérez se le nota.',
      'Marina Pérez',
    )
    expect(scrubbed).not.toMatch(/Marina/i)
    expect(scrubbed).not.toMatch(/Pérez/i)
    expect(scrubbed).toContain(NAME_TOKEN)
  })

  it('no destroza las palabras cortas del nombre', () => {
    // "de" y "la" aparecen en cualquier frase: sustituirlas dejaría el texto
    // ilegible y le quitaría sentido al contexto que da el lead.
    const scrubbed = scrubName(
      'Ana de la Torre coordina la migración de la base.',
      'Ana de la Torre',
    )
    expect(scrubbed).toContain('la migración')
    expect(scrubbed).not.toMatch(/\bAna\b/)
    expect(scrubbed).not.toMatch(/\bTorre\b/)
  })

  it('es insensible a mayúsculas', () => {
    expect(scrubName('marina entrega a tiempo', 'Marina')).toBe(`${NAME_TOKEN} entrega a tiempo`)
  })

  it('trata los caracteres especiales del nombre como literales', () => {
    // Un nombre con un punto no puede convertirse en un comodín.
    expect(scrubName('A.B. trabaja bien; AXB no existe', 'A.B.')).toContain('AXB no existe')
  })
})

describe('sustitución del nombre al volver', () => {
  it('pone el nombre donde el modelo dejó el testigo', () => {
    expect(applyName(`${NAME_TOKEN} ha cumplido. Felicitar a ${NAME_TOKEN}.`, 'Marina')).toBe(
      'Marina ha cumplido. Felicitar a Marina.',
    )
  })

  it('si el modelo no devolvió el testigo, antepone el nombre', () => {
    // Preferimos un párrafo con el nombre delante a uno que hable de alguien
    // sin decir de quién.
    expect(applyName('Ha cumplido los objetivos.', 'Marina')).toBe(
      'Marina — Ha cumplido los objetivos.',
    )
  })
})

describe('respuesta del modelo', () => {
  it('acepta el JSON con los dos párrafos', () => {
    expect(parseNarrative('{"es":"Hola","en":"Hello"}')).toEqual({ es: 'Hola', en: 'Hello' })
  })

  it('rechaza lo que no es JSON, lo vacío y lo incompleto', () => {
    expect(() => parseNarrative(undefined)).toThrow(NarrativeError)
    expect(() => parseNarrative('')).toThrow(NarrativeError)
    // Una respuesta cortada por el límite de tokens llega así.
    expect(() => parseNarrative('{"es":"Hola","en":')).toThrow(NarrativeError)
    expect(() => parseNarrative('{"es":"Hola"}')).toThrow(NarrativeError)
    expect(() => parseNarrative('{"es":"  ","en":"Hello"}')).toThrow(NarrativeError)
  })
})

describe('generateNarrative', () => {
  it('devuelve los párrafos con el nombre puesto y sin enviarlo', async () => {
    const client = vi.fn(async () => ({
      es: `${NAME_TOKEN} destaca en Hard Skills.`,
      en: `${NAME_TOKEN} stands out in hard skills.`,
    }))

    const result = await generateNarrative(
      { ...DATA, observations: 'Marina Pérez ha crecido mucho.' },
      'Marina Pérez',
      client,
    )

    expect(result.es).toBe('Marina Pérez destaca en Hard Skills.')
    expect(result.en).toBe('Marina Pérez stands out in hard skills.')

    // La garantía de la pseudonimización, comprobada sobre lo que se envió.
    const sent = client.mock.calls[0]![0]
    expect(sent).not.toMatch(/Marina/i)
    expect(sent).not.toMatch(/Pérez/i)
  })

  it('reintenta una vez y falla con un error propio', async () => {
    const client = vi.fn(async () => {
      throw new Error('503 del proveedor')
    })

    await expect(generateNarrative(DATA, 'Marina', client)).rejects.toBeInstanceOf(NarrativeError)
    expect(client).toHaveBeenCalledTimes(2)
  })

  it('el segundo intento vale si el primero falló', async () => {
    let calls = 0
    const client = vi.fn(async () => {
      calls++
      if (calls === 1) throw new Error('timeout')
      return { es: 'Bien.', en: 'Good.' }
    })

    const result = await generateNarrative(DATA, 'Marina', client)
    expect(result.es).toBe('Marina — Bien.')
    expect(client).toHaveBeenCalledTimes(2)
  })
})

describe('configuración', () => {
  it('sin clave, la IA está deshabilitada', () => {
    expect(isAiConfigured(undefined)).toBe(false)
    expect(isAiConfigured('')).toBe(false)
    expect(isAiConfigured('   ')).toBe(false)
    expect(isAiConfigured('AIza-una-clave-cualquiera')).toBe(true)
  })
})
