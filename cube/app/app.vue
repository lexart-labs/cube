<template>
  <!--
    `<NuxtLayout>` es imprescindible: en cuanto existe `app.vue`, Nuxt deja de
    aplicar los layouts por su cuenta. Sin esta etiqueta, `layouts/default.vue`
    —la barra de navegación y el contenedor con márgenes— no se renderiza nunca
    y las páginas quedan pegadas al borde de la ventana.

    El fondo y la tinta vienen de `assets/css/main.css`, que los fija sobre
    `html` con los tokens de la paleta validada y respeta `data-theme`. No se
    repiten aquí con utilidades de Tailwind: serían otra fuente de verdad, y con
    otros colores.
  -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
