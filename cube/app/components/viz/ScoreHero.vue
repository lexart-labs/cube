<script setup lang="ts">
/**
 * Figura hero: el puntaje de la evaluación más reciente.
 *
 * Es un número, no un gráfico. La guía de visualización es explícita: un valor
 * único va como figura hero o stat tile, nunca como un gráfico de una sola
 * barra. Exactamente una por vista.
 *
 * Deliberadamente NO se colorea el puntaje por bandas (verde/ámbar/rojo). Los
 * colores de estado están reservados para bien/mal, y pintar de rojo el
 * desempeño de una persona convierte un dato en un juicio. El número se lee
 * solo; la comparación la da el delta.
 */
const props = defineProps<{
  score: number
  previousScore?: number | null
  label: string
  periodLabel?: string
}>()

/** Delta frente al periodo anterior. Con signo y periodo nombrado. */
const delta = computed(() => {
  if (props.previousScore == null) return null
  return props.score - props.previousScore
})
</script>

<template>
  <div>
    <p class="text-sm text-[var(--text-secondary)]">{{ label }}</p>

    <!--
      ≥48px y en la sans del sistema. Figuras proporcionales, no `tabular-nums`:
      a este tamaño los dígitos de ancho fijo hacen que "121" se vea suelto.
    -->
    <p class="mt-1 text-6xl font-semibold leading-none tracking-tight text-[var(--text-primary)]">
      {{ score }}<span class="text-3xl font-normal text-[var(--text-secondary)]">%</span>
    </p>

    <p v-if="periodLabel" class="mt-2 text-sm text-[var(--text-muted)]">
      {{ periodLabel }}
    </p>

    <p v-if="delta !== null" class="mt-1 text-sm">
      <!--
        El signo y la palabra llevan el significado; el color solo acompaña.
        Nunca color solo (requisito de accesibilidad).
      -->
      <span
        :class="
          delta > 0
            ? 'text-[var(--success-text)]'
            : delta < 0
              ? 'text-[var(--text-secondary)]'
              : 'text-[var(--text-muted)]'
        "
      >
        {{ delta > 0 ? '↑' : delta < 0 ? '↓' : '→' }}
        {{ delta > 0 ? '+' : '' }}{{ delta }} {{ $t('dashboard.points') }}
      </span>
      <span class="text-[var(--text-muted)]"> {{ $t('dashboard.vsPrevious') }}</span>
    </p>
  </div>
</template>
