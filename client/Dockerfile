# ── MangaBug Client — Multi-stage Dockerfile ──

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# A variável VITE_API_URL é injetada no build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve com nginx
FROM nginx:alpine

# Copia o build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Railway define $PORT automaticamente
EXPOSE ${PORT:-80}

# Script para substituir $PORT no nginx.conf
CMD sed -i "s/\${PORT}/${PORT:-80}/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
