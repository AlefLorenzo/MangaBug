# 🐛 MangaBug — Plataforma de Leitura de Mangá

## 📌 Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Banco**: PostgreSQL (Supabase)
- **Deploy**: Railway (Docker)

---

## 🚀 Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- Docker & Docker Compose (opcional)

### Sem Docker

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (em outro terminal)
cd client
npm install
npm run dev
```

### Com Docker

```bash
docker-compose up --build
```

Acesse:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

---

## 🌐 Deploy na Railway

### 1. Crie o projeto na Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**
3. Selecione o repositório `AlefLorenzo/MangaBug`

### 2. Configure as variáveis de ambiente

Na aba **Variables** do serviço, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://...` (sua URL do Supabase) |
| `JWT_SECRET_USER` | (gere um segredo forte) |
| `JWT_SECRET_ADMIN` | (gere um segredo forte) |
| `CORS_ORIGINS` | `https://seu-dominio.railway.app` |
| `NODE_ENV` | `production` |

### 3. Deploy automático

O Railway vai detectar o `Dockerfile` na raiz e fazer o build automaticamente.

O health check está configurado em `/api/health`.

---

## 📁 Estrutura

```
MangaBug/
├── Dockerfile            # Build unificado (Railway)
├── docker-compose.yml    # Dev local com Docker
├── railway.toml          # Config Railway
├── client/               # Frontend React + Vite
│   ├── Dockerfile        # Build isolado do frontend
│   ├── nginx.conf        # Nginx para SPA
│   └── src/
├── server/               # Backend Express + PostgreSQL
│   ├── Dockerfile        # Build isolado do backend
│   └── src/
│       ├── config/       # DB connection
│       ├── controllers/  # Lógica de negócio
│       ├── middleware/   # Auth, upload
│       ├── routes/       # Endpoints API
│       └── utils/        # Helpers
└── sql/                  # Schema SQL
```

---

## 🔧 API Endpoints

- `GET /api/health` — Health check
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET /api/works` — Listar mangás
- `GET /api/chapters/:id` — Páginas do capítulo
- `GET /api/banners` — Banners da home

---

## 📝 Licença

ISC
