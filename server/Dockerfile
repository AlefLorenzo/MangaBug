# ── MangaBug API — Dockerfile ──
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

# Copia apenas package files primeiro (melhor cache de layers)
COPY package.json package-lock.json* ./

# Instala dependências (production only)
# --include=optional garante que o sharp baixe os binários certos para Linux
RUN npm install --omit=dev --include=optional

# Copia o restante do código
COPY . .

# Cria diretórios de uploads
RUN mkdir -p uploads/covers uploads/chapters uploads/banners uploads/avatars

# Expõe a porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# Comando para iniciar usando dumb-init como PID 1
CMD ["dumb-init", "node", "src/index.js"]
