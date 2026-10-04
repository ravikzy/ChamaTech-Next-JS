"use server";

import { revalidatePath } from "next/cache";
import { getSession, isUuid } from "@/lib/session";
import { withTransaction } from "@/lib/db";
import { criarNotificacao } from "@/lib/notifications";
import { ErroDeRegra } from "@/lib/services";

const ERRO_GENERICO = "Não foi possível concluir a ação. Tente novamente.";

async function adminLogado() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session.user;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

/** Aprova o cadastro de um técnico (ele passa a poder aceitar chamados). */
export async function verificarTecnico(_prev, formData) {
  const admin = await adminLogado();
  if (!admin) return { error: "Apenas administradores podem fazer isso." };

  const technicianId = formData.get("technician_id");
  if (typeof technicianId !== "string" || !technicianId) return { error: "Técnico inválido." };

  try {
    await withTransaction(async (db) => {
      const { rows } = await db.query(
        `update technicians set is_verified = true where user_id = $1 and is_verified = false returning user_id`,
        [technicianId]
      );
      if (rows.length !== 1) throw new ErroDeRegra(409, "Este técnico não está mais pendente.");
      await criarNotificacao(db, {
        userId: technicianId,
        title: "Cadastro verificado",
        body: "Seu cadastro foi aprovado. Complete o perfil e ative a disponibilidade para receber chamados.",
      });
    });
    atualizarTelas();
    return { ok: "Técnico verificado." };
  } catch (err) {
    if (err instanceof ErroDeRegra) return { error: err.message };
    console.error("verificarTecnico:", err);
    return { error: ERRO_GENERICO };
  }
}

/**
 * Recusa o cadastro: a conta volta a ser "client". Só é possível se o
 * técnico ainda não tiver chamados (as FKs de services apontam para ele).
 */
export async function recusarTecnico(_prev, formData) {
  const admin = await adminLogado();
  if (!admin) return { error: "Apenas administradores podem fazer isso." };

  const technicianId = formData.get("technician_id");
  if (typeof technicianId !== "string" || !technicianId) return { error: "Técnico inválido." };

  try {
    await withTransaction(async (db) => {
      const { rows } = await db.query(
        `select is_verified from technicians where user_id = $1 for update`,
        [technicianId]
      );
      if (!rows[0] || rows[0].is_verified) {
        throw new ErroDeRegra(409, "Este técnico não está mais pendente.");
      }

      const { rows: chamados } = await db.query(
        `select 1 from services where technician_id = $1 limit 1`,
        [technicianId]
      );
      if (chamados.length > 0) {
        throw new ErroDeRegra(409, "Este técnico já tem chamados e não pode ser recusado.");
      }

      await db.query(`delete from technicians where user_id = $1`, [technicianId]);
      await db.query(`update "user" set role = 'client' where id = $1`, [technicianId]);
      await db.query(`insert into clients (user_id) values ($1) on conflict do nothing`, [technicianId]);
      await criarNotificacao(db, {
        userId: technicianId,
        title: "Cadastro de técnico não aprovado",
        body: "Seu cadastro de técnico não foi aprovado. Você continua com acesso como cliente.",
      });
    });
    atualizarTelas();
    return { ok: "Cadastro recusado. A conta voltou a ser de cliente." };
  } catch (err) {
    if (err instanceof ErroDeRegra) return { error: err.message };
    console.error("recusarTecnico:", err);
    return { error: ERRO_GENERICO };
  }
}

const STATUS_DISPUTA = ["reviewing", "resolved", "dismissed"];
const ROTULO_DISPUTA = {
  reviewing: "em análise",
  resolved: "resolvida",
  dismissed: "arquivada",
};

/** Atualiza o status de uma disputa e registra as notas de resolução. */
export async function atualizarDisputa(_prev, formData) {
  const admin = await adminLogado();
  if (!admin) return { error: "Apenas administradores podem fazer isso." };

  const disputeId = formData.get("dispute_id");
  const status = formData.get("status");
  const notas = String(formData.get("resolution_notes") ?? "").trim();

  if (!isUuid(disputeId)) return { error: "Disputa inválida." };
  if (!STATUS_DISPUTA.includes(status)) return { error: "Escolha um status válido." };
  if (notas.length > 1000) return { error: "As notas podem ter no máximo 1000 caracteres." };

  const encerrando = status === "resolved" || status === "dismissed";
  if (encerrando && notas.length < 3) {
    return { error: "Registre as notas de resolução antes de encerrar a disputa." };
  }

  try {
    await withTransaction(async (db) => {
      const { rows } = await db.query(
        `update disputes
            set status = $1::dispute_status,
                resolution_notes = $2,
                resolved_at = case when $3::boolean then now() else null end
          where id = $4
        returning opened_by, service_id`,
        [status, notas || null, encerrando, disputeId]
      );
      if (rows.length !== 1) throw new ErroDeRegra(404, "Disputa não encontrada.");

      await criarNotificacao(db, {
        userId: rows[0].opened_by,
        title: `Sua disputa está ${ROTULO_DISPUTA[status]}`,
        body: notas || "Um administrador está analisando o caso.",
      });
    });
    atualizarTelas();
    return { ok: "Disputa atualizada." };
  } catch (err) {
    if (err instanceof ErroDeRegra) return { error: err.message };
    console.error("atualizarDisputa:", err);
    return { error: ERRO_GENERICO };
  }
}
