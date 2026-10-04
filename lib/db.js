import { Pool } from "pg";

// Pool único reaproveitado entre requests (evita esgotar conexões em dev
// com hot-reload do Next.js).
const globalForDb = globalThis;

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

/**
 * Helper simples para queries. Uso:
 *   const { rows } = await query("select * from technicians where user_id = $1", [id]);
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Executa várias queries na mesma transação. Se a função lançar erro,
 * faz rollback; se terminar bem, faz commit. Uso:
 *   await withTransaction(async (db) => {
 *     await db.query("update ...", [..]);
 *     await db.query("insert ...", [..]);
 *   });
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
