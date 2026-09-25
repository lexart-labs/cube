# Roadmap.md — Cube v2

**Proyecto:** Cube (Lexart Labs)
**Rama:** `v2`
**Fecha:** 2026-09-08 · **Revisado:** 2026-09-25 (AD-06)
**Documento hermano:** [`Security.md`](./Security.md) — auditoría de seguridad y especificación normativa

---

## 1. Por qué

Cube se construyó como una plataforma amplia: evaluaciones, plan de carrera, tests de burnout,
árbol de gobernanza, hunting de candidatos, partners, pagos, colaboradores, control de horas y
multi-tenancy por empresa. Ese alcance se repartió en tres piezas con stacks distintos:

| Pieza | Stack | Estado |
|---|---|---|
| `backend/` | Express 4 + MySQL (conexión única, sin pool) | 17 routers · 23 servicios |
| `webapp/` | Vue 2.6 + vue-cli 4.5 + Vuex + vue-i18n | **Fin de vida desde dic-2023** |
| `ext/onboarding/` | Nuxt 3 + Tailwind + Pinia | Base de datos propia (`onboarding_db`) |

En la práctica solo dos dominios se usan: **evaluaciones de desarrolladores** y **onboarding**.
El resto es código que nadie mantiene y que amplía la superficie de ataque — la auditoría
encontró 32 hallazgos, 7 de ellos críticos, varios en módulos que ya nadie abre.

**Objetivo de v2:** una sola aplicación Nuxt 4, single-tenant, una base de datos, dos módulos,
sobre stack con soporte y con los agujeros de seguridad cerrados por diseño y no por parche.

**Criterio de éxito global:**
- Un desarrollador entra y ve sus evaluaciones sin explicación previa.
- El flujo de onboarding funciona de extremo a extremo desde una sola aplicación.
- Los 7 hallazgos críticos y los 10 altos de `Security.md` están cerrados y verificados.
- Un despliegue, una base de datos, un pipeline de CI.

---

## 2. Decisiones de arquitectura

Seis decisiones. Las cinco primeras se acordaron antes de empezar; AD-06 es de 2026-09-25 y recorta
el alcance ya construido. Se registran aquí porque condicionan todas las fases.

### AD-01 · Nuxt 4 unificado
Una sola aplicación: `app/` (Vue 3 + Tailwind) y `server/api/` (Nitro). Absorbe el backend Express
y el `ext/onboarding`.
**Motivo:** el onboarding ya es Nuxt + Tailwind, así que la mitad del frontend se porta casi tal
cual. Unificar elimina la comunicación entre servicios por API key (HIGH-08), reduce a un solo
modelo de autenticación y a un solo despliegue.
**Se descartó:** Vue 3 + Vite manteniendo Express (deja dos servicios y dos modelos de auth).

> **Revisión 2026-09-08 — Nuxt 3 → Nuxt 4.** Esta decisión se fijó como "Nuxt 3", pero al
> implementar se comprobó que 4.5.2 es la línea estable y 3.21.11 ya está en mantenimiento.
> Construir v2 sobre la rama en mantenimiento repetiría el problema que originó esta migración
> (Vue 2 EOL). Además, la estructura `app/pages`, `app/components`, `app/composables` de §4 es la
> convención **nativa** de Nuxt 4; en Nuxt 3 habría que configurar `srcDir` a mano.
> Confirmado con el usuario antes de instalar.

### AD-02 · Single-tenant
Fuera la tabla `companies`, el header `company_slug`, la vista `/rcompany` y los slugs de las rutas
de login.
**Motivo:** existe una sola empresa real. La multi-tenancy obliga a arrastrar `idCompany` en cada
JOIN, y ese arrastre es el origen directo de dos de las inyecciones SQL
(`users.service.js:682`, `levels.service.js:22`).

### AD-03 · Catálogos reducidos a Posiciones y Niveles
Se conservan `positions` y `levels` — dan contexto a la evaluación (cargo y nivel del evaluado).
Se eliminan tipos de carrera, tecnologías, `user_skills` y el Timeline/roadmap de carrera.
**Motivo:** el plan de carrera es un producto distinto del de evaluar. Mantenerlo obliga a
conservar cuatro tablas, seis endpoints y el componente `Timeline.vue` para una funcionalidad
que no se pidió.

### AD-04 · Una sola base de datos
`onboarding_db` se fusiona en `lexart_cube` mediante script de migración.
**Motivo:** las dos bases se comunicaban por API key entre servicios; al unificar la aplicación
(AD-01) esa frontera deja de existir. El aislamiento de la PII se logra mejor con cifrado a nivel
de columna (HIGH-10) que con una base separada a la que la aplicación accede igualmente.

### AD-05 · IDEAL LEXART sustituye al modelo de 27 indicadores
Las evaluaciones nuevas se hacen con el estándar **IDEAL LEXART**: bloques con peso según el rol
(Arquitecto L1/L2/L3, Desarrollador L3), notas de 1 a 5, promedio ponderado y una redacción en
español e inglés generada con Gemini. Vive en su propia tabla (`ideal_evaluations`) y en
`shared/ideal.ts`.

**Sustituye hacia delante, no hacia atrás.** Las evaluaciones de los 27 indicadores se conservan
como archivo de solo lectura: son datos reales de personas y su escala —puntaje sobre 135— no es
convertible a un promedio ponderado 1-5. El panel muestra las dos como series distintas y nunca
unidas en una línea.

> **Revisión 2026-09-25 — el modelo anterior se retira entero.** Lo de arriba deja de aplicar: la
> tabla `evaluations`, sus endpoints y sus pantallas se borraron, y `/evaluations` pasa a ser IDEAL.
> Mantener dos instrumentos con escalas incomparables obligaba a desambiguar en cada consulta, cada
> gráfico y cada test, para consultar un histórico que **sigue existiendo en la base de v1 y en su
> backup**. v2 nace con un solo instrumento. La migración tampoco los trae: no hay conversión
> posible entre una suma sobre 135 y un promedio ponderado 1-5.

**Motivo:** es el instrumento que la empresa usa hoy para evaluar, y el modelo heredado de v1 no lo
refleja. Se decide aquí, y no en marcha, porque §8 dice que lo que no está en el alcance se registra
como decisión explícita.

**Lo que trae de nuevo al sistema:** una dependencia externa (Google) y un coste por uso. Por eso la
clave es opcional —sin ella la aplicación arranca igual y solo esa función se deshabilita—, la
llamada está limitada por usuario, y **el nombre de la persona evaluada no se envía**: el modelo
escribe un testigo y el servidor lo sustituye al recibir la respuesta.

### AD-06 · Retirada de v1 y del módulo de onboarding

**2026-09-25.** Dos decisiones a la vez porque comparten causa: dejar Cube reducido a lo que la
empresa de verdad usa, que son las evaluaciones.

**v1 sale del árbol.** `backend/`, `webapp/`, `ext/onboarding/`, `db/` y los `run.*.sh` se borran de
la rama `v2`. Siguen en el historial y en `origin/main` y `origin/develop`, que es de donde
despliega producción: retirar el código de esta rama **no apaga nada**. v1 sigue sirviendo hasta que
v2 se despliegue.

**El onboarding/offboarding sale también de v2.** Lo asumirá la plataforma de Lexart. Con él se van
la extranet de candidatos, el panel de administración, las cinco tablas (`onboarding_candidates`,
`onboarding_kyc`, `onboarding_contracts`, `onboarding_sessions`, `contract_templates`), el segundo
dominio de identidad, el cifrado de columnas KYC y el almacén de ficheros subidos.

**Motivo:** el módulo estaba construido pero nunca desplegado, y mantenerlo obliga a seguir cargando
con PII (documentos de identidad, IBAN), con un segundo dominio de identidad y con la superficie de
ataque asociada, para un flujo que se va a ejecutar en otro producto.

**Se descartó** dejarlo como módulo desactivado: el coste de mantenimiento es el mismo y la PII
sigue ahí.

También el **modelo de 27 indicadores** sale de v2 en la misma sesión; queda anotado en AD-05.

**Consecuencias, para no descubrirlas después:**
- `onboarding_db` **no se migra**. Al apagar v1 pasa a ser la única copia de los KYC y contratos
  reales: `scripts/db-backup.sh` la sigue volcando a propósito, y hay que decidir su retención.
- **HIGH-10** (cifrado de columnas sensibles) deja de aplicar en v2: no está cerrado, está fuera de
  alcance, porque ya no hay columnas sensibles que cifrar.
- La **mitigación P0 de v1** (CRIT-01, CRIT-02, CRIT-03) nunca se commiteó y se ha ido con el árbol.
  Sigue explotable en producción — ver §10.1 de `Security.md`.
- v2 pasa de 43 a **19 endpoints**, de 12 a **6 tablas** y de 203 a **150 tests unitarios**.

---

## 3. Alcance: qué se conserva, qué se elimina

### Se conserva

| Dominio | Origen actual |
|---|---|
| Evaluaciones: CRUD, copia, listado por dev, filtro por año | `backend/services/courses.service.js` — la tabla es `evaluations`; el nombre "courses" es histórico |
| Definición de indicadores (desempeño / factorHumano / habilidades) | `webapp/src/data/indicadores.js` + `MAX_EVALUACION = 135` (`backend/config/conn.js:17`) |
| Cálculo de puntajes y agregación | `courses.service.js` (`calcTotal`) y `EvaluationsHandler.service.js:68-115` |
| Visualización de evaluaciones | `components/evaluationsViewer.vue`, `graphicEvaluation.vue`, `rombo.vue`, `EvaluationsComp.vue` |
| Administración de evaluaciones | `views/Admin/Evaluations.vue` |
| Usuarios (dev / lead / admin) | `services/users.service.js` — recortado |
| Posiciones y Niveles | `views/Admin/Positions.vue`, `views/Admin/Levels.vue` |
| i18n es / en / pt | `webapp/src/data/translate.js` — podado a lo que sobreviva |

### Se elimina

Tests de burnout · Candidatos / hunting · Partners · Pagos · Colaboradores · Continuity ·
Horas y el cron de sincronización con Lextracking (`backend/server.js:11-23`) · Equipos ·
Plataformas de contratación · Relaciones externas entre empresas · Árbol de gobernanza (lead tree) ·
Personify · Tecnologías y `user_skills` · Tipos de carrera · Timeline / roadmap de carrera ·
Multi-tenancy (companies, RegisterCompany) · Endpoint genérico `/upload-file` ·
**Onboarding / offboarding completo** (AD-06, desde 2026-09-25: pasa a la plataforma de Lexart).

**Reducción esperada:** 17 routers → **3** (`auth`, `users`, `evaluations`);
23 servicios → **~7**; 14 vistas de administración → **4**.

---

## 4. Arquitectura destino

```
cube/
├── app/
│   ├── pages/
│   │   ├── login.vue
│   │   ├── dashboard.vue              # dev: sus evaluaciones (solo lectura)
│   │   ├── evaluations/
│   │   │   ├── index.vue              # admin/lead: listado + filtros
│   │   │   └── [id].vue               # ver / editar
│   │   ├── admin/
│   │   │   ├── users.vue
│   │   │   ├── positions.vue
│   │   │   ├── levels.vue
│   │   │   └── onboarding.vue         # ex OnboardingUsers.vue
│   │   └── onboarding/index.vue       # extranet pública (stepper)
│   ├── components/
│   │   ├── evaluations/               # Viewer, RadarChart, ScoreRing, IndicatorForm
│   │   └── onboarding/                # LoginStep, ComplianceStep, ReviewStep, CompletionStep
│   ├── composables/                   # useAuth, useEvaluations, useOnboarding
│   └── middleware/                    # auth.ts, admin.ts
├── server/
│   ├── api/{auth,evaluations,users,positions,levels,onboarding}/
│   ├── middleware/auth.ts             # verifica sesión → event.context.user
│   ├── db/{index.ts,schema.sql,migrations/}
│   └── utils/{security.ts,validation.ts,storage.ts,crypto.ts,logger.ts}
├── storage/uploads/                   # FUERA del webroot
├── tests/{unit,e2e}/
└── nuxt.config.ts
```

### Invariantes de la arquitectura

Tres reglas que no se negocian caso por caso — son propiedades verificadas en CI:

1. **Identidad.** El actor sale **siempre** de `event.context.user`, derivado de la cookie de
   sesión firmada. Ningún handler lee `user-id`, `token` ni `company_slug` de los headers.
   *(Cierra CRIT-07; verificado por grep en CI.)*
2. **Autorización explícita.** Autenticación como middleware global con allow-list de rutas
   públicas; cada handler de administración declara `requireRole()`. Olvidar declarar deniega,
   no expone. *(Cierra HIGH-01, HIGH-02.)*
3. **Validación en la frontera.** Todo `body`, `query` y `params` pasa por un esquema Zod antes de
   tocar la lógica. Las consultas usan exclusivamente parámetros vinculados; los fragmentos que no
   los admiten (`ORDER BY`, columnas) van contra allow-list. *(Cierra CRIT-04.)*

### Sustitución de amCharts

`@amcharts/amcharts4` (sin mantenimiento + licencia comercial) se sustituye por SVG propio para el
rombo/radar y las barras de indicadores. Consultar la skill `dataviz` antes de escribir esos
componentes.

---

## 5. Fases

Las fases son secuenciales: cada una depende de la anterior. El sistema actual sigue en producción
hasta la fase 6.

---

### Fase 1 — Andamiaje y configuración segura

**Entregables**
- Proyecto Nuxt 4 + TypeScript + Tailwind + Pinia + `@nuxtjs/i18n` + `nuxt-security` + Zod.
- `server/db/index.ts`: pool `mysql2/promise` (límite 10), TLS, propagación real de errores
  mediante `reject` — no el `resolve(error)` de `backend/config/conn.js:22-28`.
- `server/utils/logger.ts`: `pino` con redacción automática de `password`, `token`, `apiKey`,
  `authorization`, `iban`, `identity_document`.
- Validación de configuración al arrancar: **falla el arranque** si falta o es débil
  `NUXT_SESSION_SECRET`, `NUXT_DB_PASSWORD` o `NUXT_KYC_ENCRYPTION_KEY`. Sin valores por defecto.
- `nuxt-security` con CSP (nonces, sin `unsafe-inline`) y HSTS.
- ESLint + Prettier + `no-console` en `server/`.

**Cierra:** HIGH-05, HIGH-06, HIGH-08, MED-03, MED-08.

**Aceptación** — verificada el 2026-09-08:
- ✅ `npm run build` pasa; `lint`, `typecheck` y `test` (11 tests) en verde.
- ✅ Borrar `NUXT_SESSION_SECRET` aborta el arranque con código 1 y enumera todos los problemas.
- ✅ Las cabeceras responden: CSP con nonce + `strict-dynamic`, HSTS `max-age=31536000;
  includeSubDomains; preload`, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy,
  Permissions-Policy y las tres cabeceras Cross-Origin.

**Dos desviaciones respecto a lo planificado, ambas justificadas:**

1. **Node 22+ obligatorio.** La cadena de build de Nuxt 4 no funciona en Node 20: `cssnano` →
   `postcss-merge-longhand@8` usa `Set.prototype.difference` (Node 22+) y declara ese `engines`.
   Node 20 además llegó a EOL en abril de 2026. El desarrollo se hace sobre **Node 24.20.0 LTS**.
   Recogido en `engines` de `package.json` y en el README.

2. **El arranque ya no aborta si la base de datos no responde.** El diseño inicial salía del
   proceso; se corrigió porque convierte un reinicio de MySQL de diez segundos en un crash-loop.
   La configuración inválida sí aborta —es una condición de seguridad—, pero la conectividad es
   operativa: se registra y `GET /api/health` devuelve 503 hasta que la base responda, que es lo
   que consumen las sondas de readiness.

---

### Fase 2 — Esquema unificado y migración de datos

**Entregables**
- `server/db/schema.sql`: `users` · `positions` · `levels` · `evaluations` ·
  `onboarding_candidates` (ex `pending_users`) · `onboarding_kyc` · `onboarding_contracts` ·
  `contract_templates` · `sessions` · `audit_log`.
- `server/db/migrations/001_v2_consolidation.sql`, que:
  - ~~copia `onboarding_db.*` a las tablas `onboarding_*` de `lexart_cube`~~ (retirado por AD-06:
    `onboarding_db` ya no se migra);
  - elimina `idCompany` / `company_slug` (AD-02);
  - descarta las tablas de los módulos removidos;
  - añade `password_hash` y `password_algo` para la transición de contraseñas (§6);
  - cifra las columnas KYC sensibles con AES-256-GCM, IV por registro
    (`identity_document`, `iban`, `bank_information`, `full_address`, `phone`,
    `emergency_phone`, `company_rut`).
- Scripts `db:backup`, `db:migrate` (con `--dry-run`) y `db:verify`.
- Traslado de los ficheros de `backend/public/uploads/` a `storage/uploads/`, fuera del webroot.

**Cierra:** HIGH-10, y prepara CRIT-02 y CRIT-05.

**Aceptación** — parcial al 2026-09-08:
- ✅ Cifrado KYC: 11 tests de ida y vuelta, incluida detección de manipulación del criptograma y de la etiqueta GCM.
- ✅ Reglas de mapeo: 16 tests sobre la resolución del identificador canónico, el mapeo de roles y la detección de huérfanas.
- ✅ Puntaje portado de v1: 9 tests, contrastado contra la fila real id=154 del seed.
- ⛔ **Sin verificar contra una base real.** No hay MySQL ni Docker en el entorno de desarrollo, así que el SQL de `migrate.ts` y `verify.ts` no se ha ejecutado nunca. Pendiente de ejecutar:

```bash
npm run db:backup                   # vuelca lexart_cube y onboarding_db
npm run db:migrate -- --dry-run     # informa qué haría, sin escribir
npm run db:migrate
npm run db:verify                   # conteos origen vs destino + integridad
```

**Desviación respecto a lo planificado:** la migración **no transforma v1 en el sitio**, sino que
lee de v1 y escribe en una base nueva con el esquema de v2. Es más seguro: v1 sigue intacta y en
marcha, la verificación compara ambas en vivo, y revertir es descartar la base nueva. Con docker
compose, además, la base de v2 es un contenedor recién creado y "en el sitio" ni siquiera aplica.

**Hallazgo de la migración.** `evaluations.idLextracking` no es clave foránea de `users.id` ni de
`users.idLextracking`, sino del identificador canónico `COALESCE(idLextracking, id)` — v1 hace ese
fallback en `users.service.js:288`. Se puede confirmar en la fila 154 del seed: apunta a 105, y el
usuario 105 tiene `idLextracking = null`. Si dos usuarios colisionan en esa clave, las evaluaciones
quedarían mal asignadas sin error alguno; `buildCanonicalIndex` detecta y reporta esos casos.

---

### Fase 3 — API y núcleo de seguridad

**Entregables**
- Endpoints Nitro para los cuatro dominios.
- `server/middleware/auth.ts`: sesión en cookie `httpOnly` + `Secure` + `SameSite=Lax`,
  access token de 15 min + refresh rotativo con detección de reutilización, revocación vía tabla
  `sessions` (habilita logout real y "cerrar sesión en todos los dispositivos").
- `requireRole('admin' | 'lead')` en cada handler de administración.
- bcrypt coste 12, hash en la aplicación —nunca en SQL—, comparación en tiempo constante.
- Rehash transparente MD5 → bcrypt en el primer login correcto (§6).
- Rate limiting: `/api/auth/login` (10 intentos / 15 min por IP y por cuenta, retroceso
  exponencial), límite global por IP, límite específico en subidas.
- Subidas en `storage/uploads/`, nombres con `crypto.randomUUID()`, validación por magic bytes,
  servidas por `GET /api/onboarding/documents/[id]` con verificación de permisos.
- Contrato de error único `{ statusCode, message }` con `requestId`. Nunca `sqlMessage`, nunca stack traces.
- `audit_log` para las acciones administrativas del onboarding (aprobar, cambiar estado, borrar).
- Enlace de activación de un solo uso en lugar de enviar contraseñas por correo.

**Lógica de negocio a portar:** `courses.service.js` (`calcTotal`, `copy`, `getYears`),
`EvaluationsHandler.service.js:68-115` (agregación de indicadores) y el flujo de aprobación de
`onboarding.service.js`.

**Cierra:** CRIT-01, CRIT-03 … CRIT-07, HIGH-01 … HIGH-04, HIGH-07, HIGH-09, MED-04 … MED-07.

**Aceptación** — parcial al 2026-09-08. 130 tests unitarios en verde, lint y typecheck limpios, build correcto.

Verificado por `tests/unit/invariants.test.ts`, que comprueba el código y no el comportamiento —
porque las vulnerabilidades de v1 fueron fallos de disciplina, no de lógica:
- ✅ Ningún fichero del servidor lee `user-id`, `user_id`, `company_slug` ni `lextoken` (CRIT-07).
- ✅ Solo `middleware/01.auth.ts` escribe `event.context.user`.
- ✅ Todo handler de `server/api/` llama a `requireUser` o `requireRole`, salvo dos públicos por diseño (HIGH-01, HIGH-02).
- ✅ Ninguna consulta interpola `params`/`body`/`query` dentro del SQL; el detector tiene su propio test para no dar falsa tranquilidad (CRIT-04).
- ✅ La capa de datos usa `execute()` (sentencias preparadas) y `multipleStatements: false`.
- ✅ Sin `console.*` en `server/` salvo la excepción justificada del arranque (HIGH-08).

Cobertura por hallazgo:
- ✅ CRIT-05 — bcrypt coste 12 y rehash transparente desde MD5; 9 tests, incluido el camino heredado.
- ✅ CRIT-06 — la contraseña nunca se envía por correo; al aprobar se reutiliza el hash que el candidato fijó.
- ✅ CRIT-07 — la identidad sale solo de la sesión; 12 tests de RBAC.
- ✅ HIGH-03 — sesión opaca revocable; el logout invalida de verdad.
- ✅ HIGH-07 — contrato de error único con `requestId`; nunca `sqlMessage` ni trazas.
- ✅ MED-02 — el texto libre se guarda como texto plano, así que el frontend no necesita `v-html` en ninguna parte. La clase de XSS desaparece en vez de mitigarse.
- ✅ MED-04 — límite por IP y por cuenta con retroceso exponencial; 6 tests.
- ✅ MED-05/06 — nombres con `randomUUID()` y tipo detectado por firma binaria; 15 tests, incluidos ejecutable y HTML disfrazados de PDF.
- ✅ CRIT-02/CRIT-03 — subida autenticada y descarga por endpoint con verificación de referencia en base; nada bajo `storage/` es alcanzable como estático.

**Desviación:** sesión **opaca en base de datos** en lugar de JWT de 15 min + refresh rotativo.
El reproche central de HIGH-03 es que los tokens de v1 no se podían revocar, y con un JWT corto
el logout sigue sin ser inmediato. El token opaco da revocación instantánea, elimina la
dependencia de JWT —y con ella el riesgo de confusión de algoritmo— y a esta escala una lectura
indexada por petición es irrelevante.

**Un fallo que encontraron los tests.** `fakeVerify()`, la defensa contra enumeración de cuentas
por tiempo de respuesta, usaba un hash bcrypt escrito a mano que la librería rechazaba sin hacer
trabajo: devolvía en microsegundos y la defensa era inerte. Ahora el hash señuelo se genera al
arrancar con el mismo coste que los reales.

**Cerrado el 2026-09-08.** 34 endpoints, 131 tests, lint y typecheck limpios, build correcto.

**Dos dominios de identidad separados.** Los candidatos de la extranet tienen tabla
(`onboarding_sessions`), cookie (`cube_onboarding`) y contexto (`event.context.candidate`)
propios. Si compartieran mecanismo con los usuarios de Cube, un token de candidato podría
presentarse contra la API interna y solo el rol impediría el acceso — una sola comprobación
olvidada bastaría. Con dominios distintos, ese token no resuelve nada ahí. Verificado por
invariante: ningún handler de `/onboarding/public/` puede usar `requireUser` ni `requireRole`.

**MED-07 y CRIT-06 cerrados de raíz.** No hay registro abierto ni contraseñas por correo: el alta
la inicia un lead o admin y genera un token de invitación de un solo uso, devuelto UNA VEZ en la
respuesta y guardado solo como SHA-256. El servidor nunca conoce la contraseña de nadie — la fija
el candidato al activar. "No existe", "caducado" y "ya usado" comparten mensaje, para no permitir
sondear qué invitaciones son válidas.

**⛔ Ningún endpoint se ha ejecutado contra una base real**, por el mismo bloqueo de la Fase 2.
Lo verificado es la lógica pura y los invariantes del código; un error de nombre de columna no lo
detecta nada de lo escrito hasta ahora.

---

### Fase 4 — Frontend de evaluaciones

**Entregables**
- Dashboard del desarrollador: sus evaluaciones, evolución por año, detalle por indicador.
  Es la vista que más importa — "que lo puedan ver de forma sencilla" significa que un dev entra
  y entiende su situación sin instrucciones.
- Vista admin/lead: listado con filtros, crear, editar, copiar, desactivar.
- Componentes de visualización reescritos en Vue 3 + SVG (radar/rombo, anillo de puntaje, barras
  por indicador).
- `v-html` solo con DOMPurify en cliente **y** sanitización en servidor al guardar `observaciones`.
- i18n es/en/pt podado a las claves que sobreviven.

**Cierra:** MED-01, MED-02 (parcial).

**Aceptación** — parcial al 2026-09-08.

Verificado por HTTP contra el servidor construido, ya sin base de datos:
- ✅ `/login` renderiza (200); `/` redirige (302).
- ✅ `/api/evaluations`, `/api/users` y `/api/onboarding/candidates/1/approve` devuelven **401 sin sesión**. Este último era CRIT-01, explotable en v1 con `curl -H 'token: x'`.
- ✅ `storage/` no se sirve como estático: 404 por URL directa (CRIT-02).
- ✅ MED-01 cerrado: el token vive en cookie `httpOnly`; el cliente nunca lo toca.
- ✅ MED-02 cerrado: **no hay un solo `v-html` en toda la aplicación**. Las observaciones se guardan como texto plano saneado en el servidor y se pintan con `white-space: pre-wrap`.

**Decisiones de visualización**, siguiendo la guía `dataviz`:
- **Se elimina el rombo/radar de v1.** Un radar dificulta comparar magnitudes —el área crece con el cuadrado del valor y el orden de los ejes cambia la forma sin cambiar los datos— y no está entre las formas recomendadas. Se sustituye por barras horizontales, que es la forma correcta cuando el trabajo del lector es comparar magnitudes; horizontales porque los nombres en español son largos.
- **amCharts 4 fuera** (sin mantenimiento desde amCharts 5, licencia comercial) y sustituido por SVG propio: una línea de evolución y barras, unas decenas de líneas de `path`.
- **Paleta validada con el script**, no a ojo: banda de luminosidad, suelo de croma y contraste ≥ 3:1 pasan en claro y en oscuro.
- **El puntaje NO se colorea por bandas de severidad.** Los colores de estado están reservados para bien/mal, y pintar de rojo el desempeño de una persona convierte un dato en un juicio.
- Cada gráfico tiene su vista de tabla; ningún valor es accesible solo por el gráfico ni solo por el color.

**Dos defectos de maquetación detectados al inspeccionar la geometría**, que el validador de color no puede ver: la etiqueta del último punto se recortaba por arriba con un puntaje de 100, y la última etiqueta del eje X quedaba a 1px del borde. Ambos corregidos con margen interno y anclaje hacia dentro en los extremos.

**i18n cablejado en es/en/pt.** Verificado sirviendo `/login` con cada idioma: "Evaluaciones de
desarrolladores" / "Developer evaluations" / "Avaliações de desenvolvedores". Ninguna cadena queda
incrustada en los componentes. Un test comprueba que los tres ficheros tienen **exactamente** las
mismas claves, que ningún valor está vacío y que las interpolaciones (`{name}`, `{count}`)
coinciden entre idiomas: una traducción que falta no lanza error, vue-i18n cae al idioma por
defecto y el fallo solo lo ve quien use ese idioma. Las fechas siguen el idioma activo, no un
`'es'` fijo.

**Administración añadida:** `/admin/users` (alta, cambio de rol, activar/desactivar — que
**revoca las sesiones abiertas** y lo confirma en pantalla) y `/admin/catalogs` (posiciones y
niveles, que se desactivan y nunca se borran). Ambas responden 302 al login sin sesión, no 404.

**⛔ Único pendiente de la Fase 4:**
- **Los gráficos no se han visto renderizados en un navegador.** Se instaló Chromium de Playwright
  (114 MB) pero no arranca: le faltan 16 bibliotecas del sistema (`libglib-2.0`, `libnss3`…) que
  requieren root para instalarse. La geometría se verificó numéricamente sobre el SVG generado,
  incluidos los casos extremos que revelaron dos recortes de etiqueta, pero **no hay inspección
  visual**. En un entorno con las dependencias del sistema, `npm run test:e2e` ya tiene el binario.
- Sin base de datos, no se han podido ejecutar los tres criterios funcionales originales (dev ve
  solo lo suyo, admin crea/edita/copia, los totales coinciden con `calcTotal` de v1).

---

### Fase 5 — Frontend de onboarding · ⬛ RETIRADA (AD-06)

> **2026-09-25 — este módulo ya no existe.** Se construyó, se verificó por HTTP y nunca llegó a
> desplegarse; el flujo pasa a la plataforma de Lexart. Lo que sigue se conserva como registro de lo
> que se hizo y de los hallazgos que dejó, no como descripción del sistema actual. El código está en
> el historial de git.

**Entregables**
- Los cinco componentes de `ext/onboarding/components/` portados (ya son Vue 3 + Tailwind: es un
  movimiento casi directo).
- DOMPurify en el `v-html` de `ComplianceStep.vue:162` — hoy sin sanitizar (MED-02).
- `views/Admin/OnboardingUsers.vue` → `app/pages/admin/onboarding.vue`.
- Descarga de contratos por endpoint autenticado.

**Cierra:** MED-02 (completo).

**Aceptación** — parcial al 2026-09-08. Verificado por HTTP contra el servidor construido:
- ✅ La extranet `/onboarding` es accesible **sin sesión de Cube**, en los tres idiomas.
- ✅ Los cuatro endpoints de candidato (`me`, `kyc`, `contracts`, `upload`) devuelven 401 sin sesión de candidato.
- ✅ Desde la extranet **no se alcanza la API de Cube**: `/api/users` y `/api/onboarding/candidates` responden 401.
- ✅ La descarga de documentos exige sesión (401) y el salto de directorio (`../../etc/passwd`) se rechaza.

**Dos gaps de la API que aparecieron al construir el flujo**, y que estaban en la Fase 3 sin detectar:
- `/api/onboarding/upload` exigía rol lead, así que **el candidato no podía subir sus propios contratos firmados** — que es justo lo que hace el paso de compliance en v1. Se añadió `/api/onboarding/public/upload`, con el destino tomado de SU sesión y nunca del cuerpo: aceptarlo del cliente sería reabrir CRIT-07 en el punto más sensible del sistema.
- Faltaba `GET /api/onboarding/public/kyc`, sin el cual quien volviera a mitad del proceso tendría que reescribir todos sus datos.

**MED-02 cerrado del todo.** El visor de contratos era el sitio exacto del hallazgo:
`ComplianceStep.vue:162` de v1 pintaba la plantilla con `v-html` **sin DOMPurify**, en el paso
previo a pedir los datos KYC. En v2 el servidor devuelve las plantillas ya convertidas a texto
plano y el visor las pinta con interpolación normal. **No queda un solo `v-html` en la aplicación.**

**MED-07 cerrado.** No hay registro abierto: sin invitación no se puede crear una cuenta. El
enlace se muestra una sola vez en el panel y en base solo queda su SHA-256.

**Decisión de diseño:** el paso del asistente lo deriva el servidor del estado real del candidato,
no un contador en el cliente. Quien recargue a mitad vuelve donde estaba, y nadie puede saltarse
un paso manipulando el navegador.

**⛔ Pendiente:**
- **El flujo completo no se ha ejecutado** (registro → KYC → contratos → revisión → aprobación),
  por el mismo bloqueo de base de datos. Tampoco se ha comprobado que la aprobación quede en
  `audit_log`, aunque el código la escribe.
- Sin inspección visual, por las dependencias de sistema que faltan para Chromium.

---

### Fase 6 — Infraestructura, CI y retirada

**Entregables**
- `docker-compose.yml` único (mysql + app).
- `Dockerfile` multi-etapa, usuario sin privilegios, `HEALTHCHECK`.
- `.github/workflows/ci.yml`: lint + typecheck + test + `npm audit --audit-level=high` + `gitleaks`.
- Vitest: lógica de evaluaciones (`calcTotal`, agregaciones) y auth/RBAC.
- Playwright: los dos flujos completos.
- Dependabot con auto-merge para parches.
- Rotación de todos los secretos del inventario de [`Security.md` §8](./Security.md#8-inventario-y-rotación-de-secretos).
- **Solo entonces:** eliminar `backend/`, `webapp/` y `ext/`.

**Cierra:** MED-09, LOW-01 … LOW-06.

**Aceptación** — al 2026-09-09.

Ejecutado localmente, todo en verde: `lint`, `typecheck`, 142 tests unitarios,
`npm audit --audit-level=high` (0 vulnerabilidades), `build` y `verify:build`.

**El CI ejecuta lo que aquí no se puede.** `.github/workflows/ci.yml` levanta **MySQL 8.4 como
servicio**, aplica `schema.sql`, corre la semilla y lanza los E2E contra una base real. Es el
único sitio donde el esquema y los 39 endpoints se ejecutan de verdad: el entorno de desarrollo
no tiene MySQL ni Docker. Cinco trabajos: `static`, `security`, `build`, `e2e` y `docker`.

Lo que cada trabajo protege, con su hallazgo detrás:
- `npm ci` en todos: aborta si package.json y el lockfile divergen — que es lo que rompió el contenedor con `bcryptjs`.
- `npm audit --audit-level=high` bloqueante (MED-09: v1 arrastró Vue 2 EOL y axios 0.23 durante años).
- `gitleaks` sobre el historial completo (HIGH-05, §8: v1 tiene el pepper `y0ur.k3y` en el código).
- `verify:build`: comprueba que el build sea autosuficiente antes de construir la imagen.
- El trabajo `docker` construye la imagen, comprueba que el contenedor **arranca y sirve `/login`**, y que el proceso **no corre como root**.
- Los secretos del CI se generan por ejecución con `openssl rand`; ninguno fijo en el repositorio.

**Tests E2E** (`tests/e2e/`): flujo de evaluaciones, flujo de onboarding y las comprobaciones de
[`Security.md` §9](./Security.md#9-verificación), que hasta ahora solo existían como comandos en
un documento. Entre ellas: que forjar `user-id` no amplía el alcance (CRIT-07), que la carga
`' OR 1=1 --` se trata como texto de búsqueda (CRIT-04), que la cookie es `httpOnly` (MED-01),
que el logout revoca al instante y que cambiar la contraseña cierra las sesiones abiertas
(HIGH-03), que un 404 no filtra `sqlMessage` (HIGH-07), y que la sesión de candidato no abre la
API de Cube.

**Semilla** (`npm run db:seed`): catálogos, cuatro usuarios, evaluaciones de ejemplo, plantillas
de contrato y dos candidatos —uno con invitación conocida y otro con KYC cifrado—. Incluye a
propósito **una cuenta con contraseña MD5**, para poder probar el rehash transparente tal como
llegarán los usuarios migrados de v1. Aborta si `NODE_ENV=production` o si la base ya tiene datos.

**Dependabot** semanal para npm, acciones del CI e imagen base, con los parches agrupados.

**v1 retirada del árbol el 2026-09-25 (AD-06), con las condiciones aún sin cumplir.** El Roadmap
condicionaba el borrado a CI verde en el repositorio, secretos rotados y v2 desplegada. Nada de eso
se cumple todavía; la retirada se hizo igualmente porque **borrar el código de la rama `v2` no apaga
el servicio**: producción despliega desde `origin/main` y `origin/develop`, donde v1 sigue entera.

Lo que eso deja abierto, y conviene no perder de vista:
- la migración **nunca se ha ejecutado**, ni siquiera en dry-run;
- v1 **sigue en producción** y es el único sistema que funciona hoy;
- los secretos del inventario de §8 **siguen sin rotar** — borrar el código no invalida una clave
  que ya está publicada en el historial;
- el CI todavía no ha corrido nunca en GitHub;
- la mitigación P0 de v1 estaba sin commitear y se fue con el árbol (§10.1 de `Security.md`).

Apagar v1 de verdad —parar pm2, retirar los virtual hosts, archivar las bases— sigue siendo una
decisión explícita y pendiente.

---

## 6. Migración de contraseñas

MD5 no es reversible: los hashes existentes no se pueden convertir a bcrypt sin las contraseñas en claro.

**Estrategia adoptada — rehash transparente:** en el primer login correcto, si
`password_algo = 'md5-legacy'`, se verifica contra MD5 y —en la misma petición, con la contraseña
aún en memoria— se recalcula con bcrypt, se actualiza el registro y se marca `'bcrypt'`.
El usuario no nota nada.

**Ventana: 60 días desde el despliegue de v2.** Al vencer:
1. Se invalidan todas las contraseñas que sigan en `'md5-legacy'`.
2. Esas cuentas reciben un enlace de restablecimiento.
3. Se elimina del repositorio el código de verificación MD5.

**Comunicación:** avisar a los usuarios antes del despliegue y a los 45 días a quienes no hayan
entrado todavía.

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Los hallazgos críticos son explotables hoy** | Alto | Mitigar en producción **antes** de v2 con reglas en NGINX: bloquear `/public/uploads/signed-documents` y `/api/upload`, exigir autenticación en `/onboarding/*`. Ver `Security.md` §10, prioridad P0. |
| **Rehash de contraseñas** | Medio | Ventana de 60 días con rehash transparente (§6) + comunicación previa. |
| **Cron de Lextracking** (`backend/server.js:11-23`, sincroniza horas cada día 1 a la 01:30) | Medio | Se elimina. **Confirmar con el equipo que ningún consumidor externo depende de ese job antes de la fase 6.** |
| **URLs de documentos ya distribuidas** | Medio | Al mover los ficheros fuera del webroot, las URLs viejas dejan de resolver. Inventariar dónde se compartieron y reemitir enlaces autenticados. |
| **Pérdida de datos en la migración** | Alto | Backup + `--dry-run` + `db:verify` con conteos y checksums. Ensayo completo sobre una copia de producción antes de ejecutar. |
| **Regresión funcional en evaluaciones** | Medio | Comparación directa de `calcTotal` viejo vs nuevo sobre evaluaciones reales (fase 4, criterio 3). |
| **Alcance que se expande** | Medio | AD-01…AD-04 están cerradas. Cualquier funcionalidad fuera de §3 se registra como propuesta post-v2, no se añade en marcha. |
| **Secretos ya comprometidos** | Alto | Inventario y rotación en `Security.md` §8, **antes** del despliegue de v2. La API key del onboarding se ha estado registrando en claro en cada petición. |

---

## 8. Fuera de alcance (post-v2)

Se registran para que la decisión sea explícita y no se cuelen en marcha:

- Reintroducir el plan de carrera / roadmap como producto propio, si se pide.
- SSO con Google Workspace (hay integración parcial en `ext/onboarding`; se retira en v2 y se
  reevalúa después).
- Volver a multi-tenancy, si alguna vez se vende la plataforma.
- Exportación de evaluaciones a PDF.
- Notificaciones por correo más allá del onboarding.
- Migrar a KMS/secret manager gestionado (v2 usa variables de entorno).

---

## 9. Seguimiento

Estado al **2026-09-25**, tras AD-06.

| Fase | Estado | Cierra |
|---|---|---|
| 0 · `Roadmap.md` + `Security.md` | ✅ Completa | — |
| 1 · Andamiaje y configuración segura | ✅ Completa | HIGH-05, HIGH-06, HIGH-08, MED-03, MED-08 |
| 2 · Esquema y migración de datos | 🟡 Escrita, sin ejecutar nunca contra una base real | ~~HIGH-10~~ (fuera de alcance por AD-06) |
| 3 · API y núcleo de seguridad | ✅ Completa (sin ejecutar contra base real) | CRIT-04…07, HIGH-01…04, HIGH-07, HIGH-09, MED-01…06 |
| 4 · Frontend de evaluaciones | ✅ Completa | MED-01, MED-02 |
| 5 · Frontend de onboarding | ⬛ Retirada (AD-06) | — |
| 6 · Infraestructura, CI y retirada | 🟡 v1 fuera del árbol; CI sin ejecutar en GitHub | MED-09, LOW-01…06 |
| 7 · IDEAL LEXART (AD-05) | ✅ Completa. El modelo anterior se retiró entero el 2026-09-25 | — |
| P0 · Mitigación en producción | ⛔ Escrita el 2026-09-21, **nunca commiteada**, retirada con el árbol de v1. Explotable en producción | CRIT-01, CRIT-02, CRIT-03 |

**Bloqueo de cabecera:** `cube/` y `.github/` siguen **sin commitear**. Mientras sigan así, el CI no
puede ejecutarse en GitHub, y el CI es el único sitio donde el esquema y los 26 endpoints se
ejecutan contra MySQL de verdad.

**Hallazgo del 2026-09-25, ya corregido:** `seedOnStartup` y `db.ssl` usaban
`z.coerce.boolean()`, que convierte la cadena `"false"` en `true`. Como `nuxt.config.ts` declara
`'false'` como valor por defecto, **la semilla estaba activada sin que nadie la pidiera**: el primer
arranque contra una base vacía habría creado `admin@cube.test` con la contraseña publicada en el
repositorio. Corregido con `envFlag()` y con tres tests de regresión en `tests/unit/config.test.ts`.

**CRIT-01, CRIT-02 y CRIT-03** eran hallazgos del onboarding de v1. En v2 no tienen equivalente
porque el módulo ya no existe (AD-06); en producción siguen abiertos.
