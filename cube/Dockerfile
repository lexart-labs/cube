# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Etapa 1 — dependencias
# Se separa del build para que un cambio en el código no invalide la caché de
# npm, y para que el modo desarrollo pueda reutilizar solo esta etapa.
# ---------------------------------------------------------------------------
FROM node:24.20.0-slim AS deps
WORKDIR /app

# `npm ci` exige el lockfile e instala exactamente lo fijado: una build
# reproducible es también un control de seguridad (nadie introduce una versión
# distinta entre dos despliegues).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
# Etapa 2 — build de producción
# ---------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

COPY . .

# El build NO necesita secretos: `runtimeConfig` se resuelve al arrancar, no al
# compilar. Por eso ningún ARG ni ENV con credenciales entra en la imagen.
RUN npm run build

# ---------------------------------------------------------------------------
# Etapa 3 — runtime
# Imagen mínima: solo `.output`. Sin código fuente, sin node_modules de
# desarrollo, sin la cadena de build.
# ---------------------------------------------------------------------------
FROM node:24.20.0-slim AS runtime
WORKDIR /app

# NPM_CONFIG_UPDATE_NOTIFIER evita que npm escriba en el home en ejecución.
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=builder --chown=node:node /app/.output ./.output

# El proceso no corre como root. La imagen base ya trae el usuario `node` (uid 1000).
USER node

EXPOSE 3000

# Usa el propio Node en vez de curl/wget: no hace falta añadir paquetes al
# runtime solo para la sonda, y menos paquetes es menos superficie.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
