# --- ETAPA 1: Construcción (Builder) ---
FROM node:18-alpine AS builder

WORKDIR /webapp

# Copiamos los archivos de configuración de npm
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install

# --- EL CAMBIO ESTÁ AQUÍ ---
# Copiamos absolutamente todo el contenido actual al contenedor
COPY . .

# Verificamos si el archivo 'env' existe antes de compilar (esto ayudará a debuguear)
# Si este comando falla, es porque el archivo no está en tu carpeta local
RUN ls -la | grep env || echo "ADVERTENCIA: No se encontró ningún archivo que contenga 'env'"

# Ejecutamos el build
RUN npm run build


# --- ETAPA 2: Producción ---
FROM node:18-alpine AS production

# Crear usuario seguro
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webapp -u 1001

WORKDIR /webapp

# Servidor estático
RUN npm install -g http-server && \
    npm cache clean --force

# Copiamos solo el resultado de la compilación
COPY --from=builder --chown=webapp:nodejs /webapp/dist ./dist

USER webapp

EXPOSE 8080

CMD ["http-server", "dist", "-p", "8080"]
