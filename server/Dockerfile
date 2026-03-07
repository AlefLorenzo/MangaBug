# ── MangaBug API — Dockerfile ──
FROM node:20-alpine

# Dependências nativas para compilar sharp em Alpine Linux
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

# Copia apenas package files primeiro (melhor cache de layers)
COPY package.json package-lock.json* ./

# Instala dependências (--omit=dev: sintaxe npm 9+)
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# Cria diretórios de uploads
RUN mkdir -p uploads/covers uploads/chapters uploads/banners uploads/avatars

# Remove build deps para reduzir tamanho
RUN apk del .build-deps

# Expõe a porta (Railway define $PORT automaticamente)
EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

# Comando para iniciar
CMD ["node", "src/index.js"]
