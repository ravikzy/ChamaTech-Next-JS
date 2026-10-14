import { getSession } from "@/lib/session";
import { withTransaction } from "@/lib/db";
import { ErroDeRegra } from "@/lib/services";
import { registrarAuditoria } from "@/lib/audit";

// POST /api/tornar-tecnico — promove a conta logada de "client" para "technician".
// O cadastro sempre nasce como client; quando vem de /cadastro?perfil=tecnico,
// o formulário chama esta rota logo depois. O papel só muda aqui, no servidor.
export async function POST() {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirme seu e-mail antes de solicitar o perfil técnico." }, { status: 403 });
  }

  try {
    await withTransaction(async (db) => {
      // Só quem ainda é "client" pode virar técnico por aqui (admin e técnico não).
      const { rows } = await db.query(
        `select role from "user" where id = $1 for update`,
        [session.user.id]
      );
      if (rows[0]?.role === "technician") return;
      if (rows[0]?.role !== "client") {
        throw new ErroDeRegra(400, "Conta não pode ser promovida.");
      }

      // Quem já tem chamado ou avaliação como cliente não pode perder o perfil
      // de cliente (as FKs de services e reviews apontam para ele).
      const { rows: historico } = await db.query(
        `select 1 from services where client_id = $1
         union all
         select 1 from reviews where client_id = $1
         limit 1`,
        [session.user.id]
      );
      if (historico.length > 0) {
        throw new ErroDeRegra(409, "Esta conta já tem chamados como cliente.");
      }

      await db.query(`update "user" set role = 'technician' where id = $1`, [session.user.id]);

      // O perfil de cliente criado no cadastro deixa de existir: a conta agora é técnico.
      await db.query(`delete from clients where user_id = $1`, [session.user.id]);
      await db.query(
        `insert into technicians (user_id, is_available, is_verified)
         values ($1, false, false) on conflict do nothing`,
        [session.user.id]
      );
      await registrarAuditoria(db, {
        actorId: session.user.id,
        action: "role_changed",
        targetId: session.user.id,
        details: { fromRole: "client", toRole: "technician" },
      });
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof ErroDeRegra) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Erro em /api/tornar-tecnico:", err);
    return Response.json({ error: "Não foi possível promover a conta." }, { status: 500 });
  }
}
