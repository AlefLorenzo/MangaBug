# ── MangaBug — Dockerfile Unificado para Railway ──
# Multi-stage: compila frontend + roda backend servindo tudo

# ============================================
# Stage 1: Build do frontend (React + Vite)
# ============================================
FROM node:20-alpine AS client-builder

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
FROM node:20-alpine

# ── Dependências nativas para compilar sharp em Alpine Linux ──
# sharp precisa de: vips, build tools (python3/make/g++), pkgconfig
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    pkgconfig \
    && apk add --no-cache \
    vips-dev \
    fftw-dev \
    libc6-compat

WORKDIR /app

# Copia package files do backend
COPY server/package.json server/package-lock.json* ./server/

# Instala dependências (--omit=dev é a sintaxe correta do npm 9+)
# --ignore-scripts evita build do sharp antes de copiar o código
RUN cd server && npm install --omit=dev

# Copia código do backend
COPY server/src/ ./server/src/

# Copia o build do frontend
COPY --from=client-builder /app/client/dist ./client/dist

# Cria diretórios de uploads
RUN mkdir -p server/uploads/covers server/uploads/chapters server/uploads/banners server/uploads/avatars

# Remove build deps para reduzir tamanho da imagem final
RUN apk del .build-deps

WORKDIR /app/server

# Porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
