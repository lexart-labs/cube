import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
  },
}).append({
  name: 'cube/server-no-console',
  files: ['server/**/*.ts'],
  rules: {
    /**
     * El servidor usa el logger de `server/utils/logger.ts`, que redacta
     * secretos y PII automáticamente. `console.log` los escribiría en claro,
     * que es exactamente HIGH-08 de Security.md.
     *
     * La única excepción es el mensaje de configuración inválida en
     * `plugins/00.bootstrap.ts`, donde el logger puede no existir todavía; ahí
     * se silencia con un `eslint-disable-next-line` y su justificación.
     */
    'no-console': 'error',
  },
})
