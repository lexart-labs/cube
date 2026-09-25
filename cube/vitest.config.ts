import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

/**
 * CPUs realmente disponibles.
 *
 * Dentro de un contenedor con cuota, `os.cpus()` —lo que mira vitest para
 * decidir cuántos workers lanzar— devuelve los cores de la máquina anfitriona,
 * no los que el cgroup permite usar. Con una cuota de 1 CPU y 8 cores a la
 * vista, la suite arrancaba ocho procesos a repartirse un core: los tests de
 * bcrypt (coste 12 a propósito, CRIT-05) pasaban de tardar 1,5 s a agotar
 * cualquier plazo, y fallaban por contención sin que hubiera nada roto.
 *
 * Devuelve `undefined` si no hay cuota, para no estorbar en una máquina normal
 * ni en el CI.
 */
function quotaCpus(): number | undefined {
  try {
    // cgroup v2: "<cuota> <periodo>" en microsegundos, o "max <periodo>".
    const [quota, period] = readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim().split(/\s+/)
    if (!quota || quota === 'max' || !period) return undefined
    return Math.max(1, Math.floor(Number(quota) / Number(period)))
  } catch {
    return undefined
  }
}

const cpus = quotaCpus()

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',

    /**
     * 20 s en vez de 5. Un hash bcrypt de coste 12 tarda entre uno y cuatro
     * segundos, y varios tests encadenan unos cuantos. No se baja el coste para
     * acelerar: probar con un coste distinto al de producción no probaría lo
     * que importa.
     */
    testTimeout: 20_000,

    // Ver `quotaCpus`. Sin cuota, se deja el valor por defecto de vitest.
    ...(cpus ? { maxWorkers: cpus, minWorkers: 1 } : {}),
  },
})
