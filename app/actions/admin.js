"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { withTransaction } from "@/lib/db";
import { criarNotificacao } from "@/lib/notifications";
import { ErroDeRegra } from "@/lib/services";
import { registrarAuditoria } from "@/lib/audit";
import { moderarAvaliacao } from "@/lib/services";
import { enviarEmailEvento } from "@/lib/email";

const ERRO_GENERICO = "Não foi possível concluir a ação. Tente novamente.";
const TechnicianIdSchema = z.string().trim().min(1, "Técnico inválido.").max(128, "Técnico inválido.");
const DisputeUpdateSchema = z.object({
  dispute_id: z.string().uuid("Disputa inválida."),
  status: z.enum(["reviewing", "resolved", "dismissed"], { errorMap: () => ({ message: "Escolha um status válido." }) }),
  resolution_notes: z.string().trim().max(1000, "As notas podem ter no máximo 1000 caracteres."),
});
const ReviewModerationSchema = z.object({
  report_id: z.string().uuid("Denúncia inválida."),
  decision: z.enum(["hide", "keep"]),
});

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

  const parsedId = TechnicianIdSchema.safeParse(formData.get("technician_id"));
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };
  const technicianId = parsedId.data;

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
      await registrarAuditoria(db, {
        actorId: admin.id,
        action: "technician_verified",
        targetId: technicianId,
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

  const parsedId = TechnicianIdSchema.safeParse(formData.get("technician_id"));
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };
  const technicianId = parsedId.data;

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
      await registrarAuditoria(db, {
        actorId: admin.id,
        action: "technician_rejected",
        targetId: technicianId,
        details: { fromRole: "technician", toRole: "client" },
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

const ROTULO_DISPUTA = {
  reviewing: "em análise",
  resolved: "resolvida",
  dismissed: "arquivada",
};

/** Atualiza o status de uma disputa e registra as notas de resolução. */
export async function atualizarDisputa(_prev, formData) {
  const admin = await adminLogado();
  if (!admin) return { error: "Apenas administradores podem fazer isso." };

  const parsed = DisputeUpdateSchema.safeParse({
    dispute_id: formData.get("dispute_id"),
    status: formData.get("status"),
    resolution_notes: formData.get("resolution_notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { dispute_id: disputeId, status, resolution_notes: notas } = parsed.data;

  const encerrando = status === "resolved" || status === "dismissed";
  if (encerrando && notas.length < 3) {
    return { error: "Registre as notas de resolução antes de encerrar a disputa." };
  }

  try {
    let emailRecipients = [];
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

      const { rows: parties } = await db.query(
        `select sv.id, sv.protocol, sv.client_id, sv.technician_id
           from services sv where sv.id = $1`,
        [rows[0].service_id]
      );
      const service = parties[0];
      emailRecipients = [service.client_id, service.technician_id].filter(Boolean).map((userId) => ({
        userId,
        href: userId === service.client_id ? `/chamados/${service.id}` : `/meus-chamados/${service.id}`,
        protocol: service.protocol,
      }));

      await criarNotificacao(db, {
        userId: rows[0].opened_by,
        title: `Sua disputa está ${ROTULO_DISPUTA[status]}`,
        body: notas || "Um administrador está analisando o caso.",
        href: emailRecipients.find(({ userId }) => userId === rows[0].opened_by)?.href ?? "/notificacoes",
      });
      await registrarAuditoria(db, {
        actorId: admin.id,
        action: encerrando ? "dispute_resolved" : "dispute_status_changed",
        targetId: disputeId,
        details: { status },
      });
    });
    if (encerrando) {
      await Promise.all(emailRecipients.map(({ userId, href, protocol }) => enviarEmailEvento({
        userId,
        subject: `Disputa ${status === "resolved" ? "resolvida" : "arquivada"} · ${protocol}`,
        text: notas || "A equipe atualizou a disputa do chamado.",
        href,
      })));
    }
    atualizarTelas();
    return { ok: "Disputa atualizada." };
  } catch (err) {
    if (err instanceof ErroDeRegra) return { error: err.message };
    console.error("atualizarDisputa:", err);
    return { error: ERRO_GENERICO };
  }
}

export async function moderarAvaliacaoAction(_prev, formData) {
  const admin = await adminLogado();
  if (!admin) return { error: "Apenas administradores podem fazer isso." };

  const parsed = ReviewModerationSchema.safeParse({
    report_id: formData.get("report_id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const result = await moderarAvaliacao(admin, {
      reportId: parsed.data.report_id,
      decision: parsed.data.decision,
    });
    if (!result.ok) return { error: result.error };
    atualizarTelas();
    return { ok: parsed.data.decision === "hide" ? "Avaliação ocultada." : "Denúncia arquivada; avaliação mantida." };
  } catch (error) {
    console.error("moderarAvaliacaoAction:", error);
    return { error: ERRO_GENERICO };
  }
}
