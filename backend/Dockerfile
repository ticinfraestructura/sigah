# ============================================
# SIGAH Backend - Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS runner

# Instalar OpenSSL para Prisma en producción
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos necesarios desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/seed.ts ./src/seed.ts

# Exponer puerto
EXPOSE 3001

# Comando de inicio: migrar BD y arrancar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
