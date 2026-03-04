# MangaPremium - Site de Leitura de Mangá

Um site completo, moderno e responsivo para leitura de mangás, construído com **React.js** e **Node.js**.

## 🚀 Como Iniciar

### 1. Banco de Dados (MySQL via XAMPP)

- Abra o Painel de Controle do XAMPP e inicie o **Apache** e **MySQL**.
- Vá para `http://localhost/phpmyadmin`.
- Crie um banco de dados chamado `manga_db`.
- Importe o arquivo localizado em `sql/database.sql`.

### 2. Backend (Node.js)

```bash
cd server
npm install
npm run dev (ou: nodemon src/index.js)
```

*O servidor rodará em `http://localhost:5000`.*

### 3. Frontend (React)

```bash
cd client
npm install
npm run dev
```

*O site estará disponível em `http://localhost:5173`.*

## 🎨 Cores Utilizadas

- **Fundo:** `#0F172A` (Azul Escuro Profundo)
- **Destaque Azul:** `#3B82F6`
- **Destaque Roxo:** `#8B5CF6`
- **Destaque Laranja:** `#F59E0B`

## ✨ Funcionalidades

- **Área do Usuário:** Home com grid de capas, Detalhes do Mangá, Leitor contínuo.
- **Área Admin:** Dashboard com estatísticas e gestão de títulos (em `/admin`).
- **Segurança:** Autenticação JWT e senhas criptografadas com bcrypt.
- **Performance:** Imagens otimizadas e carregamento rápido com Vite.
