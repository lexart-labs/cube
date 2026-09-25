<script setup lang="ts">
/**
 * Confirmación modal.
 *
 * Sustituye a `confirm()` del navegador, que no se puede traducir, no se puede
 * estilar y en algunos navegadores permite silenciar los siguientes avisos —
 * justo el que importa. Aquí la acción destructiva siempre pregunta.
 *
 * Se usa `<dialog>` nativo a propósito: el foco entra y sale solo, `Escape`
 * cierra y el resto de la página queda inerte sin escribir una trampa de foco a
 * mano. Lo único que hay que hacer es sincronizar `open` con showModal/close.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    /** Texto del botón que confirma. Por defecto, "Sí". */
    confirmLabel?: string
    /** Acción destructiva: el botón de confirmar se pinta como tal. */
    danger?: boolean
  }>(),
  { message: '', confirmLabel: '', danger: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    const el = dialog.value
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  },
)

/**
 * `Escape` y el clic en el backdrop cierran el diálogo sin pasar por nuestros
 * botones. El evento `close` es el único sitio donde se entera de todos los
 * caminos, así que la cancelación se emite aquí.
 */
function onClose() {
  if (props.open) emit('cancel')
}

/** Un clic fuera de la tarjeta cancela: el `<dialog>` ocupa toda la pantalla. */
function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('cancel')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    :aria-label="title"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div class="p-6">
      <h2 class="text-lg font-medium">{{ title }}</h2>
      <p v-if="message" class="plain-text mt-2 text-sm text-[var(--text-secondary)]">
        {{ message }}
      </p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="btn btn-secondary"
          @click="emit('cancel')"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :class="danger ? 'btn btn-danger' : 'btn btn-primary'"
          @click="emit('confirm')"
        >
          {{ confirmLabel || $t('common.yes') }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
/* El `<dialog>` trae márgenes y borde del agente de usuario; se reemplazan por
   la misma tarjeta que usa el resto de la aplicación. */
.confirm-dialog {
  width: min(28rem, calc(100vw - 2rem));
  margin: auto;
  padding: 0;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  color: inherit;
}

.confirm-dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}
</style>
