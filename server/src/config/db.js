import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌ Database connection error:', err.message));

// Wrapper: makes pool.query return [rows, fields] like mysql2 for compatibility
const wrappedPool = {
    query: async (text, params) => {
        const result = await pool.query(text, params);
        return [result.rows, result.fields];
    },
    getConnection: async () => {
        const client = await pool.connect();
        const releaseRef = client.release.bind(client);
        const rawQuery = client.query.bind(client);

        return {
            query: async (text, params) => {
                const result = await rawQuery(text, params);
                return [result.rows, result.fields];
            },
            beginTransaction: () => rawQuery('BEGIN'),
            commit: () => rawQuery('COMMIT'),
            rollback: () => rawQuery('ROLLBACK'),
            release: () => releaseRef()
        };
    }
};

export default wrappedPool;
