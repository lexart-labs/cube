<script setup lang="ts">
const { login } = useAuth()
const { t } = useI18n()
const route = useRoute()

definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await login(email.value, password.value)
    await navigateTo((route.query.redirect as string) || '/dashboard')
  } catch (err) {
    // El servidor no distingue "no existe" de "clave incorrecta", para no
    // permitir enumerar cuentas. El cliente tampoco lo interpreta.
    error.value = apiErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

useHead({ title: () => `${t('auth.signIn')} · Cube` })
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <!--
      Dos planos: el oscuro de marca a la izquierda y el formulario a la derecha.
      En móvil el panel de marca se reduce a una franja superior, para no comerse
      la pantalla antes del campo de email.
    -->
    <aside
      class="flex shrink-0 items-center bg-[var(--header-bg)] px-6 py-8 text-[var(--text-on-dark)] md:w-[42%] md:px-12 md:py-0"
    >
      <div class="mx-auto w-full max-w-sm">
        <div class="flex items-center gap-3">
          <span
            class="brand-accent h-8 w-2"
            aria-hidden="true"
          />
          <span class="text-3xl font-bold tracking-tight">{{ $t('app.name') }}</span>
        </div>
        <p class="mt-3 text-white/70 md:mt-5 md:text-lg">{{ $t('app.tagline') }}</p>
      </div>
    </aside>

    <div class="flex flex-1 items-center justify-center px-4 py-10">
      <form class="w-full max-w-sm" novalidate @submit.prevent="onSubmit">
        <h1 class="text-2xl font-bold tracking-tight">{{ $t('auth.signIn') }}</h1>

        <label class="mt-8 block text-sm font-semibold" for="email">{{ $t('auth.email') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          required
          class="field mt-1.5"
        >

        <label class="mt-5 block text-sm font-semibold" for="password">
          {{ $t('auth.password') }}
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="field mt-1.5"
        >

        <p v-if="error" role="alert" class="mt-5 text-sm text-[var(--text-primary)]">
          {{ error }}
        </p>

        <button type="submit" :disabled="submitting" class="btn btn-primary mt-7 w-full">
          {{ submitting ? $t('auth.signingIn') : $t('auth.signIn') }}
        </button>
      </form>
    </div>
  </div>
</template>
