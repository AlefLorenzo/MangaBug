# ── MangaBug — Dockerfile Unificado para Railway ──
# Faz build do frontend + roda o backend servindo tudo

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

# Instala ferramentas de build necessárias para compilar módulos nativos (como sharp)
# do zero, se os binários pré-compilados falharem por qualquer motivo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia package files do backend
COPY server/package.json server/package-lock.json* ./server/

# Configura o ambiente para compilação nativa se necessário
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false

# Instala dependências (production only)
# --include=optional garante que o sharp baixe os binários certos para Linux
RUN cd server && npm install --omit=dev --include=optional

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

# dumb-init como PID 1 — gerencia processos corretamente
CMD ["dumb-init", "node", "src/index.js"]
