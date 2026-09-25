<script setup lang="ts">
const { user, isLead, isAdmin, logout } = useAuth()
const { t, locale, locales, setLocale } = useI18n()
const route = useRoute()

const links = computed(() => {
  const base = [{ to: '/dashboard', label: t('nav.dashboard') }]
  if (isLead.value) {
    // Apunta a IDEAL, que es el modelo vigente (AD-05). El archivo de los 27
    // indicadores se alcanza desde ahí.
    base.push({ to: '/evaluations', label: t('nav.evaluations') })
  }
  if (isAdmin.value) {
    base.push(
      { to: '/admin/users', label: t('nav.users') },
      { to: '/admin/catalogs', label: t('nav.catalogs') },
    )
  }
  return base
})

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

const availableLocales = computed(() =>
  (locales.value as { code: string; name?: string }[]).map((l) => ({
    code: l.code,
    name: l.name ?? l.code,
  })),
)

const menuOpen = ref(false)
watch(() => route.path, () => (menuOpen.value = false))

function onLocaleChange(event: Event) {
  setLocale((event.target as HTMLSelectElement).value as typeof locale.value)
}
</script>

<template>
  <div class="min-h-screen bg-[var(--page-plane)]">
    <!--
      Barra oscura, como en v1 (`--color-header: #2c2d31`). Es lo que hace que
      Cube se reconozca de un vistazo, y es además el único fondo sobre el que
      el ámbar de marca alcanza contraste suficiente: 7.99:1 aquí frente a
      1.72:1 sobre blanco.
    -->
    <header class="bg-[var(--header-bg)] text-[var(--text-on-dark)]">
      <div class="mx-auto flex max-w-6xl items-center gap-x-8 px-4 py-3 sm:px-6 lg:px-8">
        <NuxtLink to="/dashboard" class="flex shrink-0 items-center gap-2">
          <!-- El acento ámbar: pequeño, sobre oscuro, nunca portando datos. -->
          <span
            class="brand-accent h-6 w-1.5"
            aria-hidden="true"
          />
          <span class="text-lg font-bold tracking-tight">{{ $t('app.name') }}</span>
        </NuxtLink>

        <!--
          El corte está en `lg` y no en `md`: con rol admin la barra lleva cinco
          enlaces más el idioma, el nombre y Salir, y a 768px se solapan.
        -->
        <nav class="hidden flex-1 gap-x-1 lg:flex" :aria-label="$t('nav.main')">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-[var(--radius-control)] px-3 py-1.5 text-sm transition-colors"
            :class="
              isActive(link.to)
                ? 'bg-white/10 font-semibold text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            "
            :aria-current="isActive(link.to) ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="ml-auto flex items-center gap-3">
          <label class="hidden sm:block">
            <span class="sr-only">{{ $t('common.language') }}</span>
            <select
              :value="locale"
              class="rounded-[var(--radius-control)] border border-white/15 bg-transparent px-2 py-1 text-sm text-white"
              @change="onLocaleChange"
            >
              <option
                v-for="item in availableLocales"
                :key="item.code"
                :value="item.code"
                class="text-[var(--text-primary)]"
              >
                {{ item.name }}
              </option>
            </select>
          </label>

          <template v-if="user">
            <span class="hidden text-sm text-white/70 sm:inline">{{ user.name }}</span>
            <button
              type="button"
              class="hidden rounded-[var(--radius-control)] border border-white/15 px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10 sm:inline-flex"
              @click="logout"
            >
              {{ $t('auth.logout') }}
            </button>
          </template>

          <button
            type="button"
            class="rounded-[var(--radius-control)] p-1.5 text-white lg:hidden"
            :aria-expanded="menuOpen"
            :aria-label="$t('nav.menu')"
            @click="menuOpen = !menuOpen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <!--
        Navegación en pantallas estrechas. Recoge además lo que la barra oculta
        ahí: el selector de idioma y la identidad de quien ha entrado. Si no,
        por debajo de 640px no había forma de cambiar de idioma ni de salir.
      -->
      <nav
        v-if="menuOpen"
        class="border-t border-white/10 px-4 pb-4 sm:px-6 lg:hidden"
        :aria-label="$t('nav.main')"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block rounded-[var(--radius-control)] px-3 py-2 text-sm"
          :class="isActive(link.to) ? 'bg-white/10 font-semibold text-white' : 'text-white/75'"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>

        <div
          class="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3 sm:hidden"
        >
          <label>
            <span class="sr-only">{{ $t('common.language') }}</span>
            <select
              :value="locale"
              class="rounded-[var(--radius-control)] border border-white/15 bg-transparent px-2 py-1 text-sm text-white"
              @change="onLocaleChange"
            >
              <option
                v-for="item in availableLocales"
                :key="item.code"
                :value="item.code"
                class="text-[var(--text-primary)]"
              >
                {{ item.name }}
              </option>
            </select>
          </label>

          <template v-if="user">
            <span class="text-sm text-white/70">{{ user.name }}</span>
            <button
              type="button"
              class="ml-auto rounded-[var(--radius-control)] border border-white/15 px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10"
              @click="logout"
            >
              {{ $t('auth.logout') }}
            </button>
          </template>
        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <slot />
    </main>
  </div>
</template>
