import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL antes de aplicar o schema.");
  process.exit(1);
}

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(sql);
  console.info("Schema do ChamaTech aplicado.");
} catch (error) {
  console.error(`Não foi possível aplicar o schema: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
