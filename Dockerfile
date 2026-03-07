# ── MangaBug — Dockerfile Unificado para Railway ──
# Multi-stage: compila frontend + roda backend servindo tudo

# ============================================
# Stage 1: Build do frontend (React + Vite)
# ============================================
FROM node:20-slim AS client-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ ./

# Em produção, API fica na mesma origem (sem CORS cross-domain)
ENV VITE_API_URL=""
RUN npm run build

# ============================================
# Stage 2: Backend + frontend estático
# ============================================
FROM node:20-slim

# Pacotes de sistema mínimos para produção
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia package files do backend
COPY server/package.json server/package-lock.json* ./server/

# Instala dependências — sharp instala binário prebuilt automaticamente em Debian
RUN cd server && npm install --omit=dev

# Copia código do backend
COPY server/src/ ./server/src/

# Copia o build do frontend
COPY --from=client-builder /app/client/dist ./client/dist

# Cria diretórios de uploads
RUN mkdir -p server/uploads/covers server/uploads/chapters server/uploads/banners server/uploads/avatars

WORKDIR /app/server

# Porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# dumb-init como PID 1 — reap zombie processes corretamente
CMD ["dumb-init", "node", "src/index.js"]
