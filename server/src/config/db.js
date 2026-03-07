import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let pool = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL não definida. Banco desativado.");
} else {

  const isProduction = process.env.NODE_ENV === "production";

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction
      ? { rejectUnauthorized: false }
      : false,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Teste de conexão (não bloqueia o servidor)
  setTimeout(async () => {
    try {
      await pool.query("SELECT 1");
      console.log("✅ PostgreSQL conectado com sucesso");
    } catch (err) {
      console.warn("⚠️ PostgreSQL ainda não conectado:", err.message);
    }
  }, 2000);
}

const db = {

  query: async (text, params) => {

    if (!pool) {
      throw new Error("Database não configurado");
    }

    const result = await pool.query(text, params);
    return [result.rows, result.fields];
  },

  getConnection: async () => {

    if (!pool) {
      throw new Error("Database não configurado");
    }

    const client = await pool.connect();
    const rawQuery = client.query.bind(client);

    return {
      query: async (text, params) => {
        const result = await rawQuery(text, params);
        return [result.rows, result.fields];
      },
      beginTransaction: async () => rawQuery("BEGIN"),
      commit: async () => rawQuery("COMMIT"),
      rollback: async () => rawQuery("ROLLBACK"),
      release: () => client.release()
    };
  }
};

export default db;