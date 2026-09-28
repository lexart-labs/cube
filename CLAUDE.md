# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado: el repositorio es `cube/` y nada más

El 2026-09-25 se retiró v1 del árbol (`backend/`, `webapp/`, `ext/onboarding/`, `db/` y los
`run.*.sh`), se retiró el módulo de **onboarding/offboarding** también de v2 (AD-06: pasa a la
plataforma de Lexart) y se retiró el **modelo de evaluación de 27 indicadores** entero. Queda una
sola aplicación, `cube/`, con un solo dominio funcional: **evaluaciones**.

El 2026-09-27 se retiró además el **nombre IDEAL LEXART**. El modelo no cambió —bloques con peso
por rol, notas de 1 a 5, promedio ponderado— pero ya no se llama así en ninguna parte: ni en el
código, ni en la interfaz, ni en la base.

v1 sigue existiendo en el historial de git y en las ramas `origin/main` y `origin/develop`, que es
de donde despliega producción. Borrarlo de la rama `v2` no apagó nada: v1 sigue en marcha en el
servidor hasta que v2 se despliegue.

**Antes de hacer cambios, leer:**

- **`Roadmap.md`** — las seis decisiones de arquitectura (AD-01 Nuxt unificado, AD-02 single-tenant,
  AD-03 catálogos reducidos, AD-04 una sola base, AD-05 modelo de evaluación —su nombre, IDEAL
  LEXART, se retiró el 2026-09-27—, **AD-06 retirada de v1 y del
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
npm run test           # vitest, 16 ficheros / 222 tests, sin base de datos
npm run test:e2e       # playwright, 66 tests — necesita `build` previo y base sembrada
npx vitest run tests/unit/evaluation.test.ts     # un solo fichero
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
no es convertible al promedio ponderado de v2. Esos datos se quedan en la base de v1 y en su
backup, que `scripts/db-backup.sh` sigue haciendo por eso mismo.

## Arquitectura

```
cube/
  shared/     Código compartido cliente+servidor, alias `#shared/` (Nuxt 4 dir.shared)
  app/        Vue 3 + Tailwind 4 — pages, components, composables, middleware, layouts
  server/     Nitro — api/ (23 endpoints internos + 2 en api/external/), db/,
              middleware/, plugins/, utils/
  tests/      unit/ (vitest) y e2e/ (playwright)
```

- **Sesión opaca en base de datos** (tabla `sessions`), no JWT: el logout revoca al instante y
  cambiar la contraseña cierra las sesiones abiertas (HIGH-03).
- **Un solo dominio de identidad para las personas**: `event.context.user`, poblado únicamente por
  `server/middleware/01.auth.ts` desde la cookie `cube_session`. El onboarding tenía el suyo propio
  (`event.context.candidate`, cookie `cube_onboarding`); se fue con el módulo, y un invariante
  impide reintroducir un contexto paralelo sin que se vea.
- **La API externa (`/api/external/`) es el segundo y único modo de acceso que no es una persona**:
  clave en cabecera, `event.context.apiClient`, `server/middleware/02.external.ts`. `01.auth.ts`
  ni siquiera resuelve la cookie bajo ese prefijo, así que las dos identidades no coinciden nunca
  en la misma petición. Cuatro invariantes lo sostienen (ver regla 11).
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
   reactivar** — `/admin/catalogs` y `/admin/users` con "mostrar desactivados", y
   `/admin/api-keys` con el filtro de estado. La lista por defecto es la de lo activo: desactivar
   tiene que quitarlo de en medio, pero si no hay forma de volver a verlo, desactivar equivale a
   perder.
10. **Toda acción destructiva confirma con `<UiConfirmDialog>`**, nunca con `confirm()` ni
    `alert()` del navegador: no se traducen y el navegador puede ofrecer silenciarlos. Reactivar no
    pregunta; la confirmación es para lo que quita algo de en medio.
11. **La identidad de la API externa no sale de `/api/external/`.** Solo
    `server/middleware/02.external.ts` escribe `event.context.apiClient`; solo `requireApiKey()`
    lo lee; `requireApiKey` no se usa fuera de `server/api/external/`; y ahí dentro nadie llama a
    `requireUser`/`requireRole`. Un handler externo sin `requireApiKey` también falla el test.

## Dominio: evaluaciones

Bloques con peso según el rol (Arquitecto L1/L2/L3, Desarrollador L3), notas de 1 a 5, promedio
ponderado 1,00-5,00 y su equivalente en porcentaje (`avg/5`). Tabla `evaluations`, API
`/api/evaluations`, pantallas `/evaluations`, `/evaluations/new` y `/evaluations/:id`.

**El nombre IDEAL LEXART se retiró el 2026-09-27** (AD-05 sigue describiendo el modelo, no el
nombre). Con él se fueron `shared/ideal.ts` → `shared/evaluation.ts`, `server/api/ideal/` →
`server/api/evaluations/`, `IDEAL_ROLES` → `EVALUATION_ROLES`, las claves i18n `ideal.*` →
`evaluation.*` y la tabla `ideal_evaluations` → `evaluations`. Si aparece "IDEAL" en algún sitio
nuevo, es que se ha copiado de un commit viejo.

> Una base anterior a esa fecha **sí se arregla sola** desde el 2026-09-28: el arranque aparta la
> `evaluations` del modelo viejo a `evaluations_old` y mueve `ideal_evaluations` a su sitio
> (`server/db/repairs.ts`). Solo renombra, nunca borra.

El modelo anterior —27 indicadores sobre 135, tabla `evaluations`, `/api/evaluations`— **se retiró
entero el 2026-09-25**, no quedó como archivo de solo lectura: las dos escalas no son comparables y
mantener las dos obligaba a desambiguar en cada consulta y en cada gráfico. El histórico se queda en
la base de v1. Ojo con el detalle incómodo: **el nombre `evaluations` que ahora usa v2 es el que
tenía la tabla del modelo viejo en v1**. No son la misma tabla ni la misma escala, y la migración
sigue sin tocar ninguna de las dos.

- `shared/evaluation.ts` es la **única** fuente de roles, bloques, pesos, preguntas y fórmula. El
  formulario, el servidor y la semilla importan lo mismo; no dupliques el cálculo (es lo que pasó
  con el 135).
- Las preguntas son un borrador para que Lexart las corrija. Cambiarlas no afecta a lo ya guardado:
  cada fila almacena las notas junto al rol con el que se evaluó.
- El bloque de idiomas tiene **escala cerrada 1/3/5**. Un 2 o un 4 se rechazan.
- Los pesos de cada rol suman 100, con test.

### Editar y eliminar (desde el 2026-09-27)

`PATCH /api/evaluations/:id` hace las dos cosas y las dos tienen el mismo permiso: **quien la hizo
o un administrador**, no cualquier lead. Vale también para `POST .../narrative`.

- **Rol, fecha y notas se envían juntos**; las observaciones, sueltas si se quiere. `evaluatedUserId`
  no se acepta: cambiar a quién evalúa no es corregir, es atribuirle a otro las notas del primero.
- **Editar limpia `narrative_es`, `narrative_en`, `ai_model` y `generated_at`.** El párrafo
  describía otras notas. No se regenera dentro del PATCH: guardar no puede depender de que la IA
  responda, igual que en el alta.
- **"Eliminar" es `active = 0`** (regla 9), no un DELETE. El listado acepta `?includeDeleted=true`
  para lead y admin, y desde ahí se restaura; a la persona evaluada una eliminada le responde 404
  también por URL directa.

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

## Administración de usuarios y catálogos

`/admin/users` y `/admin/catalogs` hacen el CRUD completo (la D es desactivar, regla 9). Reglas
que el servidor impone y que no hay que relajar al tocar estas pantallas:

- **Email de usuario y nombre de catálogo son `UNIQUE`**: el duplicado se comprueba antes del
  INSERT/UPDATE y devuelve 409 con texto. Sin eso sale el 500 genérico de HIGH-07 y nadie sabe
  qué ha pasado.
- **La cadena de mando no admite ciclos** (`server/utils/orgchart.ts`). Nada recorre hoy la
  jerarquía, así que un bucle no rompe ninguna pantalla — solo deja un organigrama sin sentido
  esperando al primer informe que suba por él. La comprobación va en JS y no en un
  `WITH RECURSIVE`, que sobre datos ya ciclados revienta con un error del motor.
- **No se degrada a developer a quien tiene reportes activos**; desactivarlo sí se permite, y la
  respuesta devuelve `orphanedReports` para poder avisar.
- **Cambiar la contraseña revoca las sesiones; cambiar el email no**: la sesión cuelga del id, no
  del email.
- `/api/users` admite `?role=lead,admin` (varios roles separados por comas) y devuelve
  `position_id`, `level_id` y `lead_id` además de los nombres, que es lo que necesita el
  formulario de edición para saber qué opción viene seleccionada.
- Los catálogos tienen sus propias acciones de auditoría, `catalog.create` y `catalog.update`.
  Antes reutilizaban `user.update` y el registro no distinguía "cambió de rol a alguien" de
  "renombró un nivel".

## API externa (`/api/external/`)

Existe para que la plataforma de Lexart dé de alta usuarios sin entrar por la interfaz (AD-06 se
llevó allí el onboarding). Dos endpoints: `POST /api/external/v1/users` y
`GET /api/external/v1/whoami`. La administración de claves vive en `/admin/api-keys` y en
`/api/api-keys` (solo admin).

- **Bloqueada por defecto.** Tener el token no basta: hay que venir de una IP o un dominio
  declarados en `api_key_allowlist`, y una clave nueva no tiene ninguno. Las IPs cubren servidor a
  servidor; los dominios se comparan contra `Origin` y gobiernan además el CORS. Sin entradas no
  entra nadie, y la pantalla lo marca. No lo "arregles" haciendo que una lista vacía permita todo.
- **La IP sale del socket, no de `X-Forwarded-For`.** Esa cabecera la escribe el cliente: creerla
  convierte la lista blanca en un adorno que se salta con `X-Forwarded-For: 10.0.0.5`. Detrás de un
  proxy hay que declararlo en `NUXT_TRUSTED_PROXIES` y solo entonces se lee la cadena, de derecha
  a izquierda (`pickClientIp` en `server/utils/netmatch.ts`). Por eso ahí **no** se usa
  `getRequestIP(event, { xForwardedFor: true })`, y hay un invariante que lo impide.
- **El token se enseña una vez.** En la base solo su SHA-256 y el prefijo público, igual que en
  `sessions`. No añadas un endpoint para volver a verlo.
- **El rol se limita a `developer` y `lead`.** Una clave filtrada no puede crear un admin.
- **CORS lo resuelve `02.external.ts`**, no nuxt-security: su `corsHandler` fija un único origen y
  no sabe de listas por clave. `nuxt.config.ts` lo desactiva solo para ese prefijo con
  `routeRules`. Nunca se manda `Access-Control-Allow-Credentials`: la API no usa cookies.
- `server/utils/netmatch.ts` es puro y tiene sus propios tests. El parser de IPs rechaza lo
  ambiguo (ceros a la izquierda, familias mezcladas) en vez de adivinar, y normaliza
  `::ffff:127.0.0.1` a `127.0.0.1`, que es como Node entrega muchas conexiones IPv4.

## Trampas que solo aparecen contra una base real

Hasta hoy nada de v2 se ha ejecutado contra MySQL. Lo que ha ido saliendo:

- **El arranque repara los esquemas heredados que conoce, y solo esos** (`server/db/repairs.ts`,
  llamado desde `plugins/00.bootstrap.ts` ANTES de `ensureSchema`). Aparta con `RENAME TABLE` la
  tabla de una versión anterior que ocupe un nombre del esquema y mueve la que sí vale. **Solo
  renombra**, a un nombre libre (`_old`, `_old_2`…), y es idempotente.
  ⚠️ **No añadas una regla genérica del tipo "si una tabla no tiene la forma esperada, apártala".**
  Sería una máquina de perder datos: el día que alguien añada una columna a `users`, esa regla
  renombraría la tabla de usuarios y crearía una vacía —todas las cuentas fuera— en el arranque y
  sin que nadie lo pida. Cada reparación nombra su tabla y su precondición; lo que no esté
  enumerado lo decide una persona y mientras tanto solo se degrada la parte afectada.
- **`CREATE TABLE IF NOT EXISTS` mira el NOMBRE, no la forma.** Si en la base ya hay una tabla que
  se llama igual pero es otra cosa, el arranque no la toca y no dice nada; el fallo sale en la
  primera consulta como `Unknown column 'x' in 'field list'`, un 500 en cada pantalla y ninguna
  pista de la causa. Pasó de verdad el 2026-09-27 al renombrar `ideal_evaluations` a
  `evaluations`: ese nombre ya lo ocupaba la tabla del modelo de 27 indicadores. Desde entonces
  `verifySchemaShape()` lo comprueba en el arranque contra `information_schema`. Lo que las
  reparaciones no cubren deja en 503 **solo las rutas que dependen de esa tabla**
  (`routesAffectedBy` en `server/utils/health.ts`), con el detalle en el log. Cortar la API entera
  ante cualquier desajuste fue un intento anterior y estuvo mal: con `evaluations` rota dejaba a
  la gente sin poder ni iniciar sesión.
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
