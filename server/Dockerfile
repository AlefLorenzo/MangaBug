# ── MangaBug API — Dockerfile ──
FROM node:20-slim

# Instala o dumb-init para gerenciar melhor os processos no container
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia apenas package files primeiro (melhor cache de layers)
COPY package.json package-lock.json* ./

# Instala dependências (production only)
# No Debian, o sharp baixa os binários pré-compilados automaticamente
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# Cria diretórios de uploads
RUN mkdir -p uploads/covers uploads/chapters uploads/banners uploads/avatars

# Expõe a porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# Comando para iniciar usando dumb-init como PID 1
CMD ["dumb-init", "node", "src/index.js"]
