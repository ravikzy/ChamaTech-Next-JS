import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
if (!process.env.DATABASE_URL || !email) {
  console.error("Defina DATABASE_URL e INITIAL_ADMIN_EMAIL antes de executar o bootstrap.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();

try {
  await client.query("begin");
  await client.query("select pg_advisory_xact_lock(78231, 1)");

  const { rows: admins } = await client.query(`select 1 from "user" where role = 'admin' limit 1`);
  if (admins.length > 0) throw new Error("Já existe um administrador; o bootstrap inicial foi bloqueado.");

  const { rows } = await client.query(
    `select id, role, "emailVerified" from "user" where lower(email) = lower($1) for update`,
    [email]
  );
  const user = rows[0];
  if (!user) throw new Error("Conta não encontrada. Cadastre-a e confirme o e-mail primeiro.");
  if (!user.emailVerified) throw new Error("Confirme o e-mail da conta antes de promovê-la.");
  if (user.role !== "client") throw new Error("Somente uma conta de cliente pode ser promovida no bootstrap.");

  await client.query(`update "user" set role = 'admin' where id = $1`, [user.id]);
  await client.query(
    `insert into admin_audit_logs (actor_id, action, target_id, details)
     values ($1, 'role_changed', $1, $2::jsonb)`,
    [user.id, JSON.stringify({ fromRole: "client", toRole: "admin", method: "initial_bootstrap" })]
  );
  await client.query("commit");
  console.info("Administrador inicial criado com sucesso.");
} catch (error) {
  await client.query("rollback");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
