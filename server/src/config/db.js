import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não definida nas variáveis de ambiente');
    process.exit(1);
}

// Detecta se precisa de SSL (produção / Supabase / Railway)
const isProduction = process.env.NODE_ENV === 'production';
const needsSSL = isProduction ||
    (process.env.DATABASE_URL && (
        process.env.DATABASE_URL.includes('supabase') ||
        process.env.DATABASE_URL.includes('railway') ||
        process.env.DATABASE_URL.includes('render')
    ));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // 🔐 SSL condicional (produção / hosts remotos)
    ...(needsSSL && { ssl: { rejectUnauthorized: false } }),

    // ⚙️ Pool tuning (estável em produção)
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// 🧪 Teste de conexão ao subir o servidor
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL conectado com sucesso');
    } catch (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err);
    }
})();

// 🧱 Wrapper para compatibilidade com mysql2
const db = {
    query: async (text, params) => {
        const result = await pool.query(text, params);
        return [result.rows, result.fields];
    },

    getConnection: async () => {
        const client = await pool.connect();
        const rawQuery = client.query.bind(client);
        const release = client.release.bind(client);

        return {
            query: async (text, params) => {
                const result = await rawQuery(text, params);
                return [result.rows, result.fields];
            },
            beginTransaction: async () => rawQuery('BEGIN'),
            commit: async () => rawQuery('COMMIT'),
            rollback: async () => rawQuery('ROLLBACK'),
            release
        };
    }
};

export default db;