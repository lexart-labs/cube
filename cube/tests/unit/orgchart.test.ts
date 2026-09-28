/**
 * Cadena de mando.
 *
 * El ciclo A→B→A no rompe hoy ninguna pantalla —nada recorre la jerarquía— y
 * por eso es justo el fallo que se colaría sin que nadie lo notase hasta que
 * alguien escriba el primer informe que suba por ella. Se prueba aquí, con un
 * organigrama de mentira, para no depender de MySQL.
 */
import { describe, it, expect } from 'vitest'
import { wouldCreateLeadCycle, MAX_LEAD_DEPTH } from '../../server/utils/orgchart'

/** Organigrama en memoria: id → id de su lead. */
function chart(links: Record<number, number | null>) {
  return async (userId: number) => links[userId] ?? null
}

describe('wouldCreateLeadCycle', () => {
  it('nadie puede ser su propio lead', async () => {
    await expect(wouldCreateLeadCycle(chart({}), 7, 7)).resolves.toBe(true)
  })

  it('una asignación normal no cicla', async () => {
    // 3 → 2 → 1 → raíz. Colgar al 4 del 3 es perfectamente válido.
    const links = { 3: 2, 2: 1, 1: null }
    await expect(wouldCreateLeadCycle(chart(links), 4, 3)).resolves.toBe(false)
  })

  it('detecta el ciclo corto: mi lead pasa a ser quien me reporta', async () => {
    // Ana (1) es lead de Bruno (2). Ponerle a Ana como lead a Bruno cierra el bucle.
    const links = { 2: 1, 1: null }
    await expect(wouldCreateLeadCycle(chart(links), 1, 2)).resolves.toBe(true)
  })

  it('detecta el ciclo largo, que es el que nadie ve venir', async () => {
    // 3 → 2 → 1. Ponerle el 3 como lead al 1 cierra un triángulo.
    const links = { 3: 2, 2: 1, 1: null }
    await expect(wouldCreateLeadCycle(chart(links), 1, 3)).resolves.toBe(true)
  })

  it('una cadena ya ciclada no admite un eslabón más', async () => {
    // Si los datos ya estaban rotos, el recorrido nunca llega a la raíz. Se
    // corta por el tope en lugar de girar para siempre.
    const links = { 8: 9, 9: 8 }
    await expect(wouldCreateLeadCycle(chart(links), 1, 8)).resolves.toBe(true)
  })

  it('una jerarquía más profunda que el tope se rechaza', async () => {
    // Cada uno cuelga del siguiente, sin raíz a la vista dentro del tope.
    const links: Record<number, number> = {}
    for (let i = 2; i < MAX_LEAD_DEPTH + 10; i++) links[i] = i + 1
    await expect(wouldCreateLeadCycle(chart(links), 1, 2)).resolves.toBe(true)
  })

  it('no consulta más de lo necesario', async () => {
    // Llegar a la raíz termina el recorrido: no se sigue preguntando.
    let calls = 0
    const links: Record<number, number | null> = { 3: 2, 2: null }
    const counted = async (userId: number) => {
      calls++
      return links[userId] ?? null
    }
    await expect(wouldCreateLeadCycle(counted, 9, 3)).resolves.toBe(false)
    expect(calls).toBe(2)
  })
})
