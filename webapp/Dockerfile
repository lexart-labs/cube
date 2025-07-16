# Build stage
FROM node:18-alpine AS builder

WORKDIR /webapp

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY *.js ./
COPY *.json ./
COPY *.html ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webapp -u 1001

WORKDIR /webapp

# Install only http-server globally
RUN npm install -g http-server && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=webapp:nodejs /webapp/dist ./dist
COPY --from=builder --chown=webapp:nodejs /webapp/package*.json ./

# Switch to non-root user
USER webapp

# Expose port
EXPOSE 8080

# Start the application
CMD ["http-server", "dist", "-p", "8080"]