# ── MangaBug — Dockerfile Unificado para Railway ──
# Faz build do frontend + roda o backend servindo tudo

# Stage 1: Build do frontend
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ ./

# Em produção, API fica na mesma origem (sem CORS cross-domain)
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Backend + frontend estático
FROM node:20-alpine

# Dependências nativas do sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Instala dependências do backend
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --only=production

# Copia código do backend
COPY server/ ./server/

# Copia o build do frontend
COPY --from=client-builder /app/client/dist ./client/dist

# Cria diretórios de uploads
RUN mkdir -p server/uploads/covers server/uploads/chapters server/uploads/banners server/uploads/avatars

WORKDIR /app/server

# Saúde e porta
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
