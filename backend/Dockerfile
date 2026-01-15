# ============================================
# SIGAH Backend - Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

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

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos necesarios desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Exponer puerto
EXPOSE 3001

# Comando de inicio: migrar BD y arrancar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
