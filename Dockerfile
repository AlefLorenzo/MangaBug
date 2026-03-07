# ── MangaBug — Dockerfile Unificado para Railway ──
# Build frontend + backend Express unificado

# ============================================
# Stage 1: Build do frontend (React + Vite)
# ============================================
FROM node:20-slim AS client-builder

WORKDIR /app/client

# Melhor cache de layers
COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ ./

# Build time: VITE_API_URL vazio (mesma origem em produção)
ENV VITE_API_URL=""
RUN npm run build

# ============================================
# Stage 2: Backend + frontend estático
# ============================================
FROM node:20-slim

# Instala pacotes básicos de sistema para compilação nativa (BCRYPT, SHARP, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Configura o ambiente para compilação robusta
RUN npm install -g node-gyp

WORKDIR /app

# Copia pacotes do backend
COPY server/package.json server/package-lock.json* ./server/

# Instala dependências de produção
# sharp@0.34+ requer node-gyp disponível para instalações que fogem do binário prebuilt
RUN cd server && npm install --omit=dev --include=optional

# Copia o código fonte do backend
COPY server/src/ ./server/src/

# Copia o build final do frontend
COPY --from=client-builder /app/client/dist ./client/dist

# Estrutura de diretórios para uploads (persistência não existe no Railway sem volumes)
RUN mkdir -p server/uploads/covers server/uploads/chapters server/uploads/banners server/uploads/avatars

WORKDIR /app/server

# Porta automática da Railway
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# PID 1 transparente com dumb-init para lidar com sinais e processos órfãos
CMD ["dumb-init", "node", "src/index.js"]
