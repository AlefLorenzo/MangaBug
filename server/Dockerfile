# ── MangaBug API — Dockerfile ──
FROM node:20-slim

# Pacotes essenciais de compilação nativa (SHARP, BCRYPT, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    libc6-dev \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Instalação global do node-gyp para garantir disponibilidade
RUN npm install -g node-gyp

WORKDIR /app

# Copia package e lockfile para cache
COPY package.json package-lock.json* ./

# Instala dependências de produção. No Debian o sharp baixa binários prebuilt
# automaticamente, mas precisa das ferramentas acima instaladas se falhar.
RUN npm install --omit=dev --include=optional

# Copia o código backend
COPY . .

# Diretórios de uploads obrigatórios
RUN mkdir -p uploads/covers uploads/chapters uploads/banners uploads/avatars

# Railway porta automática $PORT
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# PID 1 transparente com dumb-init
CMD ["dumb-init", "node", "src/index.js"]
