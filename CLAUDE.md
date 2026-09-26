# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado: el repositorio es `cube/` y nada más

El 2026-09-25 se retiró v1 del árbol (`backend/`, `webapp/`, `ext/onboarding/`, `db/` y los
`run.*.sh`), se retiró el módulo de **onboarding/offboarding** también de v2 (AD-06: pasa a la
plataforma de Lexart) y se retiró el **modelo de evaluación de 27 indicadores** entero. Queda una
sola aplicación, `cube/`, con un solo dominio funcional —**evaluaciones**— y un solo instrumento
para medirlo: **IDEAL LEXART**.

v1 sigue existiendo en el historial de git y en las ramas `origin/main` y `origin/develop`, que es
de donde despliega producción. Borrarlo de la rama `v2` no apagó nada: v1 sigue en marcha en el
servidor hasta que v2 se despliegue.

**Antes de hacer cambios, leer:**

- **`Roadmap.md`** — las seis decisiones de arquitectura (AD-01 Nuxt unificado, AD-02 single-tenant,
  AD-03 catálogos reducidos, AD-04 una sola base, AD-05 IDEAL LEXART, **AD-06 retirada de v1 y del
  onboarding**), las fases con sus criterios de aceptación y la tabla de seguimiento §9.
- **`Security.md`** — 32 hallazgos con `archivo:línea` y la **especificación normativa** de cómo debe
  construirse v2. Los ficheros de v1 que cita ya no están en el árbol; se leen en el historial. Los
  hallazgos siguen siendo la referencia de por qué v2 está escrita como está.
- **`cube/README.md`** — puesta en marcha, cuentas de prueba, inventario de lo implementado.

---

## Requisitos del entorno

**Node >= 22.11 y npm >= 11.** No es opcional: la cadena de build de Nuxt 4 usa
`Set.prototype.difference` (Node 22+) y npm 10 no resuelve el grafo de peers. Con Node 20,
`npm run lint`, `typecheck` y `build` fallan con errores que no parecen de versión
(`Object.groupBy is not a function`, `trustedFunctions.difference is not a function`). `vitest` sí
funciona en Node 20, lo que despista: si los tests pasan y el build revienta, mira la versión antes
que el código.

## Comandos

```bash
cd cube
npm run dev            # desarrollo, http://localhost:3000
npm run build          # build de producción
npm run verify:build   # que .output arranque aislado — ejecutar ANTES de construir la imagen
npm run lint           # eslint (prettier NO está en el CI; no reformatees ficheros enteros)
npm run typecheck      # vue-tsc
npm run test           # vitest, 13 ficheros / 152 tests, sin base de datos
npm run test:e2e       # playwright, 37 tests — necesita `build` previo y base sembrada
npx vitest run tests/unit/ideal.test.ts          # un solo fichero
npx vitest run -t "promedio ponderado"           # un solo test

npm run db:seed        # datos de ejemplo (admin@cube.test / cube-demo-2026!)
npm run db:migrate -- --dry-run                  # migración v1 -> v2, sin escribir
npm run db:verify      # contrasta origen y destino

npm run docker:up      # stack completo (mysql + app)
npm run docker:logs    # logs de la aplicación
npm run docker:db      # cliente mysql contra la base
```

**El esquema se aplica solo al arrancar.** `server/db/schema.ts` es un módulo TS (no un `.sql`:
Nitro empaqueta JavaScript y un fichero de datos no llega a `.output`) con `CREATE TABLE IF NOT
EXISTS`. Añadir una tabla es editar ese módulo; no hay migración manual que lanzar.

**La migración lee de la base de v1 y escribe en una base nueva.** Migra solo **catálogos y
usuarios**. Ni el onboarding (AD-06) ni las evaluaciones de los 27 indicadores: su escala sobre 135
no es convertible al promedio ponderado de IDEAL. Esos datos se quedan en la base de v1 y en su
backup, que `scripts/db-backup.sh` sigue haciendo por eso mismo.

## Arquitectura

```
cube/
  shared/     Código compartido cliente+servidor, alias `#shared/` (Nuxt 4 dir.shared)
  app/        Vue 3 + Tailwind 4 — pages, components, composables, middleware, layouts
  server/     Nitro — api/ (19 endpoints), db/, middleware/, plugins/, utils/
  tests/      unit/ (vitest) y e2e/ (playwright)
```

- **Sesión opaca en base de datos** (tabla `sessions`), no JWT: el logout revoca al instante y
  cambiar la contraseña cierra las sesiones abiertas (HIGH-03).
- **Un solo dominio de identidad**: `event.context.user`, poblado únicamente por
  `server/middleware/01.auth.ts` desde la cookie `cube_session`. El onboarding tenía el suyo propio
  (`event.context.candidate`, cookie `cube_onboarding`); se fue con el módulo, y un invariante
  impide reintroducir un contexto paralelo sin que se vea.
- **La capa de datos propaga los errores de verdad** (`reject`), al contrario que el
  `resolve(error)` de v1. Usa try/catch normal.
- `server/plugins/00.bootstrap.ts`: configuración inválida → **el proceso termina**; base inaccesible
  → se registra y se sigue (`/api/health` responde 503 hasta que vuelva).

## Reglas que el código nuevo debe cumplir

No son estilo: `tests/unit/invariants.test.ts` las comprueba sobre el código y fallan en CI —salvo
la 9, que es comportamiento y la cubre `tests/e2e/admin.spec.ts`.

1. **Identidad solo desde la sesión.** `requireUser(event)` / `requireRole(event, 'lead')`. Ningún
   handler lee `user-id`, `token` ni `company_slug` de las cabeceras — ese patrón de v1 es el IDOR
   CRIT-07.
2. **Cada handler de `server/api/` declara su política de acceso.** Olvidarlo deniega, no expone.
3. **Zod en la frontera**: `validatedBody`, `validatedQuery`, `validatedParams`. Las consultas usan
   parámetros vinculados; lo que SQL no parametriza (`ORDER BY`, columnas) va contra allow-list con
   `safeOrderBy`.
4. **Nada de `console.*` en `server/`.** Usa `server/utils/logger.ts`, que redacta secretos y PII.
5. **Nada de `v-html` en `app/`.** El texto libre se guarda saneado (`sanitizeText`) y se pinta con
   la clase `.plain-text`. La clase de XSS de MED-02 desaparece en vez de mitigarse.
6. **Nada de `$fetch` directo en `app/`.** Usa `useApi().request`, `useAuth()` o `useRequestFetch()`:
   en SSR, `$fetch` no reenvía la cookie de sesión y la petición sale sin sesión.
7. **`app/app.vue` debe envolver la página en `<NuxtLayout>`.** Sin eso Nuxt no aplica ningún layout
   y la aplicación se queda sin barra de navegación ni márgenes, sin que falle nada.
8. **Toda cadena visible va a `i18n/locales/{es,en,pt}.json`.** Un test exige las mismas claves, sin
   valores vacíos y con las mismas interpolaciones en los tres idiomas.
9. **Nada se borra: se desactiva** (`active = 0`), y lo desactivado **se sigue pudiendo ver y
   reactivar** — `/admin/catalogs` con "mostrar desactivados", `/admin/users` con el filtro de
   estado. Si una lista solo devuelve lo activo, desactivar equivale a perder.
10. **Toda acción destructiva confirma con `<UiConfirmDialog>`**, nunca con `confirm()` ni
    `alert()` del navegador: no se traducen y el navegador puede ofrecer silenciarlos. Reactivar no
    pregunta; la confirmación es para lo que quita algo de en medio.

## Dominio: IDEAL LEXART, y nada más

Bloques con peso según el rol (Arquitecto L1/L2/L3, Desarrollador L3), notas de 1 a 5, promedio
ponderado 1,00-5,00 y su equivalente en porcentaje (`avg/5`). Tabla `ideal_evaluations`, API
`/api/ideal`, pantallas `/evaluations`, `/evaluations/new` y `/evaluations/:id`.

El modelo anterior —27 indicadores sobre 135, tabla `evaluations`, `/api/evaluations`— **se retiró
entero el 2026-09-25**, no quedó como archivo de solo lectura: las dos escalas no son comparables y
mantener las dos obligaba a desambiguar en cada consulta y en cada gráfico. El histórico se queda en
la base de v1.

- `shared/ideal.ts` es la **única** fuente de roles, bloques, pesos, preguntas y fórmula. El
  formulario, el servidor y la semilla importan lo mismo; no dupliques el cálculo (es lo que pasó
  con el 135).
- Las preguntas son un borrador para que Lexart las corrija. Cambiarlas no afecta a lo ya guardado:
  cada fila almacena las notas junto al rol con el que se evaluó.
- El bloque de idiomas tiene **escala cerrada 1/3/5**. Un 2 o un 4 se rechazan.
- Los pesos de cada rol suman 100, con test.

### Redacción con IA (`server/utils/gemini.ts`)

- SDK **`@google/genai`**; modelo en `NUXT_GEMINI_MODEL`, por defecto `gemini-3.8-flash`. Google
  retira modelos cada pocos meses — `gemini-1.5-flash` ya devuelve 404, y `@google/generative-ai`
  es el SDK anterior. Comprueba el modelo antes de dar por buena una respuesta 404.
- **El nombre de la persona no se envía.** El prompt lleva rol, notas y observaciones; el modelo
  escribe el testigo `[[NAME]]` y el servidor lo sustituye al recibir la respuesta. El nombre además
  se depura de las observaciones. Si tocas el prompt, mantén esa garantía: hay tests que la
  comprueban sobre lo que se envía.
- **Se guarda primero y se redacta después.** Si la IA falla, la evaluación queda registrada sin
  narrativa y se puede reintentar. No inviertas ese orden.
- `NUXT_GEMINI_API_KEY` es **opcional**: sin ella la aplicación arranca igual y solo esa función se
  deshabilita. No la metas en el bloque de configuración que aborta el arranque.

## Trampas que solo aparecen contra una base real

Hasta hoy nada de v2 se ha ejecutado contra MySQL. Lo que ha ido saliendo:

- **`lead` es palabra reservada en MySQL 8** (la función de ventana `LEAD()`). Usarla como alias
  rompe la consulta con un error de sintaxis; en `server/api/users/index.get.ts` el alias del jefe
  es `boss`. Cuidado también con `rank`, `groups`, `system`, `window`, `row`.
- **`/api/users` devuelve `{ items, total, page, limit }`**, no `{ users }`. Cada endpoint tiene su
  forma: mírala antes de escribir el tipo en el cliente.
- **No metas comentarios SQL con backticks dentro de un template literal**: cierran la cadena. La
  explicación va en un comentario JS encima de la consulta.
- **`z.coerce.boolean()` es `Boolean(valor)`: la cadena `"false"` vale `true`.** Ahí estuvo el
  fallo más feo encontrado hasta ahora: `NUXT_SEED_ON_STARTUP` traía `'false'` por defecto desde
  `nuxt.config.ts` y la semilla quedaba **activada**, lista para crear `admin@cube.test` con la
  contraseña del repositorio en el primer arranque contra una base vacía. Para banderas de entorno
  se usa `envFlag()` en `server/utils/config.ts`; para parámetros de query, un `z.enum(['true',
  'false'])` con `transform`.
- `vitest.config.ts` limita los workers a las CPU que el cgroup permite de verdad, no a las que
  anuncia la máquina. Sin eso, en un contenedor con cuota de 1 CPU se lanzaban ocho procesos a
  repartirse un core y los tests de bcrypt (coste 12 a propósito) fallaban por contención.

## Tests y CI

`.github/workflows/ci.yml` — cinco trabajos: `static` (lint, tipos, unitarios), `security`
(`npm audit --audit-level=high` + gitleaks sobre el historial), `build` (+ `verify:build`), `e2e` y
`docker`. **El CI levanta MySQL 8.4 como servicio**, aplica el esquema, siembra y corre los E2E: es
el único sitio donde el esquema y los 19 endpoints se ejecutan de verdad. Nunca ha corrido en GitHub.

`.gitleaks.toml` mantiene en su allow-list las rutas de v1 (`backend/`, `webapp/`, `ext/`, `db/`)
**aunque ya no existan**: gitleaks recorre el historial completo (`fetch-depth: 0`) y ahí siguen. No
las quites, o el trabajo `security` falla por commits de 2024.

Los E2E asumen la semilla (`tests/e2e/helpers.ts`): `admin@cube.test`, `lead@cube.test`,
`dev@cube.test` (3 evaluaciones), `dev2@cube.test`, `legacy@cube.test` (hash MD5, para el rehash);
todas con `cube-demo-2026!`.

## Convenciones de código

- Sangría y formato los decide **prettier** (2 espacios, sin punto y coma, comillas simples, 100
  columnas). El `.editorconfig` de v1 imponía tabuladores y se borró con v1.
- Los comentarios están en **español** y explican *por qué*, no *qué*: si un patrón raro existe por
  un incidente concreto, eso es lo que se escribe. Los identificadores del dominio también van en
  español (`desempeño`, `indicadores`, `observaciones`).
- Varios comentarios citan ficheros de v1 (`courses.service.js:10`, `apiAuth.js:11`) como origen de
  un hallazgo. Son referencias al historial, no a ficheros existentes; se conservan porque explican
  por qué el código es como es.
- ESLint: flat config con `@nuxt/eslint`.

## Pendientes conocidos

Detalle en `cube/README.md` y `Roadmap.md` §9.

- ⛔ **Nada está commiteado.** `cube/` entero sigue sin trackear, igual que `.github/`. Mientras siga
  así, el CI no puede ejecutarse en GitHub.
- ⛔ **La migración de datos nunca se ha ejecutado**, ni siquiera en `--dry-run`.
- ⛔ **El CI no ha corrido nunca en GitHub**; los secretos del inventario de `Security.md` §8 siguen
  sin rotar. Borrar v1 del árbol no invalida ninguna clave publicada: siguen en el historial.
- 🟡 **La mitigación P0 de v1 (CRIT-01, CRIT-02, CRIT-03) se quedó sin commitear y se retiró con el
  árbol de v1.** Sigue explotable en producción. `Security.md` §10.1 documenta qué hacía.
- ⬜ **Plan de carrera: no existe en v2.** AD-03 lo eliminó del alcance. Si vuelve, es diseño nuevo,
  no una migración.
