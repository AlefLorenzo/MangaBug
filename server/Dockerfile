# ── MangaBug API — Dockerfile ──
FROM node:20-alpine

# Instala dependências nativas do sharp (processamento de imagens)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Copia apenas package files primeiro (melhor cache de layers)
COPY package.json package-lock.json* ./

# Instala dependências (production only)
RUN npm ci --only=production

# Copia o restante do código
COPY . .

# Cria diretórios de uploads
RUN mkdir -p uploads/covers uploads/chapters uploads/banners uploads/avatars

# Expõe a porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

# Comando para iniciar
CMD ["node", "src/index.js"]
