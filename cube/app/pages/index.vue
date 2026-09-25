<script setup lang="ts">
definePageMeta({ layout: false })

/** La raíz no muestra nada: lleva al panel o al login según haya sesión. */
const { user, fetchUser } = useAuth()

if (!user.value) await fetchUser()
await navigateTo(user.value ? '/dashboard' : '/login', { replace: true })
</script>

<template>
  <div />
</template>
