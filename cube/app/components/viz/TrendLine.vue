<script setup lang="ts">
/**
 * Evolución del puntaje en el tiempo.
 *
 * Serie única, así que no lleva caja de leyenda: el título ya dice qué se
 * representa, y una leyenda de un solo elemento repite el título y ocupa
 * espacio. La identidad la lleva la propia línea.
 *
 * SVG propio en lugar de amCharts 4: sin mantenimiento desde amCharts 5 y con
 * licencia comercial, para un gráfico que son treinta líneas de path.
 */
interface Point {
  label: string
  value: number
  id?: number
}

const props = withDefaults(
  defineProps<{
    points: Point[]
    title?: string
    max?: number
  }>(),
  { max: 100, title: undefined },
)

const emit = defineEmits<{ select: [point: Point] }>()

/** Geometría del lienzo. El contenedor incluye la banda del eje x. */
const W = 640
const H = 220
const PAD = { top: 22, right: 34, bottom: 32, left: 36 }

/**
 * Margen interno horizontal: sin él, el primer punto queda encima del eje Y y
 * la etiqueta del último se sale del lienzo por la derecha.
 */
const INSET = 14

const plotW = W - PAD.left - PAD.right - INSET * 2
const plotH = H - PAD.top - PAD.bottom

const scaled = computed(() =>
  props.points.map((point, index) => {
    const x =
      props.points.length === 1
        ? PAD.left + INSET + plotW / 2
        : PAD.left + INSET + (index / (props.points.length - 1)) * plotW
    const y = PAD.top + plotH - (Math.min(point.value, props.max) / props.max) * plotH
    return { ...point, x, y }
  }),
)

const linePath = computed(() =>
  scaled.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)

/** Relleno de área: la misma tinta al 10%, nunca un bloque saturado. */
const areaPath = computed(() => {
  if (scaled.value.length < 2) return ''
  const first = scaled.value[0]!
  const last = scaled.value[scaled.value.length - 1]!
  const base = PAD.top + plotH
  return `${linePath.value} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`
})

/** Ticks redondos. Llevan los valores que no se etiquetan directamente. */
const ticks = computed(() => {
  const step = props.max / 4
  return Array.from({ length: 5 }, (_, i) => {
    const value = Math.round(i * step)
    return { value, y: PAD.top + plotH - (value / props.max) * plotH }
  })
})

const hovered = ref<number | null>(null)
const showTable = ref(false)
const tableId = useId()

const lastPoint = computed(() => scaled.value[scaled.value.length - 1] ?? null)

/**
 * Posición de la etiqueta del extremo. Va encima del punto salvo que no quepa
 * —con un puntaje de 100 el punto toca el borde superior—, en cuyo caso baja.
 * Sin esto, la etiqueta del mejor resultado posible quedaría recortada.
 */
const lastLabelY = computed(() => {
  if (!lastPoint.value) return 0
  const above = lastPoint.value.y - 12
  return above < PAD.top ? lastPoint.value.y + 20 : above
})
</script>

<template>
  <figure class="m-0">
    <figcaption v-if="title" class="mb-2 text-sm font-medium text-[var(--text-secondary)]">
      {{ title }}
    </figcaption>

    <div class="w-full overflow-x-auto">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="h-auto w-full min-w-[320px]"
        role="img"
        :aria-label="title ?? $t('dashboard.evolution')"
      >
        <!-- Rejilla: hairline sólida, un paso fuera de la superficie. Nunca discontinua. -->
        <g>
          <line
            v-for="tick in ticks"
            :key="`grid-${tick.value}`"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="tick.y"
            :y2="tick.y"
            stroke="var(--gridline)"
            stroke-width="1"
          />
          <text
            v-for="tick in ticks"
            :key="`tick-${tick.value}`"
            :x="PAD.left - 8"
            :y="tick.y + 4"
            text-anchor="end"
            font-size="11"
            fill="var(--text-muted)"
            style="font-variant-numeric: tabular-nums"
          >
            {{ tick.value }}
          </text>
        </g>

        <path v-if="areaPath" :d="areaPath" fill="var(--series-1-wash)" />

        <!-- Línea de 2px, uniones y extremos redondeados. -->
        <path
          :d="linePath"
          fill="none"
          stroke="var(--series-1)"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <g v-for="(point, index) in scaled" :key="point.label">
          <!-- Anillo de 2px en el color de la superficie: el punto se lee al cruzar la línea. -->
          <circle
            :cx="point.x"
            :cy="point.y"
            :r="hovered === index ? 6 : 4"
            fill="var(--series-1)"
            stroke="var(--surface-1)"
            stroke-width="2"
          />

          <!--
            Área de impacto de 24px, muy por encima del radio visible: obligar a
            acertar en un punto de 8px es un antipatrón de interacción.
          -->
          <circle
            :cx="point.x"
            :cy="point.y"
            r="14"
            fill="transparent"
            class="cursor-pointer"
            tabindex="0"
            role="button"
            :aria-label="`${point.label}: ${point.value}%`"
            @mouseenter="hovered = index"
            @mouseleave="hovered = null"
            @focus="hovered = index"
            @blur="hovered = null"
            @click="emit('select', point)"
            @keydown.enter="emit('select', point)"
          />

          <!--
            Primera y última se anclan hacia dentro: centradas se saldrían del
            lienzo y el navegador las recortaría.
          -->
          <text
            :x="point.x"
            :y="H - 10"
            :text-anchor="index === 0 ? 'start' : index === scaled.length - 1 ? 'end' : 'middle'"
            font-size="11"
            fill="var(--text-muted)"
          >
            {{ point.label }}
          </text>
        </g>

        <!-- Etiqueta directa solo en el extremo: nunca un número en cada punto. -->
        <text
          v-if="lastPoint"
          :x="lastPoint.x"
          :y="lastLabelY"
          text-anchor="end"
          font-size="12"
          font-weight="600"
          fill="var(--text-primary)"
        >
          {{ lastPoint.value }}%
        </text>

        <!-- Tooltip: refuerza, nunca es la única vía para leer un valor. -->
        <g v-if="hovered !== null && scaled[hovered]" pointer-events="none">
          <rect
            :x="Math.min(Math.max(scaled[hovered]!.x - 46, 2), W - 94)"
            :y="Math.max(scaled[hovered]!.y - 46, 2)"
            width="92"
            height="34"
            rx="4"
            fill="var(--surface-1)"
            stroke="var(--hairline)"
          />
          <text
            :x="Math.min(Math.max(scaled[hovered]!.x - 46, 2) + 46, W - 48)"
            :y="Math.max(scaled[hovered]!.y - 46, 2) + 14"
            text-anchor="middle"
            font-size="10"
            fill="var(--text-muted)"
          >
            {{ scaled[hovered]!.label }}
          </text>
          <text
            :x="Math.min(Math.max(scaled[hovered]!.x - 46, 2) + 46, W - 48)"
            :y="Math.max(scaled[hovered]!.y - 46, 2) + 28"
            text-anchor="middle"
            font-size="13"
            font-weight="600"
            fill="var(--text-primary)"
          >
            {{ scaled[hovered]!.value }}%
          </text>
        </g>
      </svg>
    </div>

    <button
      type="button"
      class="mt-2 text-xs text-[var(--text-secondary)] underline underline-offset-2"
      :aria-expanded="showTable"
      :aria-controls="tableId"
      @click="showTable = !showTable"
    >
      {{ showTable ? $t('common.hideTable') : $t('common.viewTable') }}
    </button>

    <table v-show="showTable" :id="tableId" class="mt-2 w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-[var(--hairline)] text-left">
          <th scope="col" class="py-1 font-medium text-[var(--text-secondary)]">
            {{ $t('evaluation.period') }}
          </th>
          <th scope="col" class="py-1 text-right font-medium text-[var(--text-secondary)]">
            {{ $t('evaluation.score') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="point in points" :key="point.label" class="border-b border-[var(--hairline)]">
          <td class="py-1 text-[var(--text-secondary)]">{{ point.label }}</td>
          <td class="py-1 text-right text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
            {{ point.value }}%
          </td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
