<script setup lang="ts">
/**
 * Nota de un indicador, como grupo de radios.
 *
 * Radios y no un `<select>` ni un slider: las cinco opciones se ven a la vez,
 * se comparan de un vistazo y se recorren con las flechas del teclado sin
 * abrir nada. Un slider además sugiere continuidad, y aquí no la hay —menos
 * todavía en la escala de idiomas, donde el 2 y el 4 no existen—.
 */
import { LANGUAGE_SCORES, MAX_SCORE, MIN_SCORE, type ScaleKind } from '#shared/ideal'

const props = defineProps<{
  modelValue: number
  label: string
  /** Identificador único del grupo: dos preguntas no pueden compartir `name`. */
  name: string
  scale: ScaleKind
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const { t } = useI18n()

const options = computed(() => {
  if (props.scale === 'languages') {
    return LANGUAGE_SCORES.map((value) => ({
      value,
      label: String(value),
      hint: t(`ideal.languages.${value}`),
    }))
  }
  return Array.from({ length: MAX_SCORE - MIN_SCORE + 1 }, (_, index) => {
    const value = MIN_SCORE + index
    return { value, label: String(value), hint: '' }
  })
})
</script>

<template>
  <fieldset class="flex flex-wrap items-center justify-between gap-3 py-2">
    <legend class="sr-only">{{ label }}</legend>
    <span class="text-sm">{{ label }}</span>

    <div class="flex shrink-0 gap-1">
      <label
        v-for="option in options"
        :key="option.value"
        class="cursor-pointer"
        :title="option.hint || undefined"
      >
        <input
          type="radio"
          class="peer sr-only"
          :name="name"
          :value="option.value"
          :checked="modelValue === option.value"
          @change="emit('update:modelValue', option.value)"
        >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--hairline)] text-sm transition-colors peer-checked:border-transparent peer-checked:bg-[var(--series-1)] peer-checked:font-semibold peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--series-1)]"
        >
          {{ option.label }}
        </span>
        <span v-if="option.hint" class="sr-only">{{ option.hint }}</span>
      </label>
    </div>
  </fieldset>
</template>
