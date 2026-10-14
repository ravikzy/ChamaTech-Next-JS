"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { withTransaction, pool } from "@/lib/db";
import { aceitarServico, mudarStatusServico } from "@/lib/services";
import { requisitosDisponibilidade } from "@/lib/technicians";
import { enviarEmailEvento } from "@/lib/email";

const ERRO_GENERICO = "Não foi possível concluir a ação. Tente novamente.";
const ServiceIdSchema = z.string().uuid("Chamado inválido.");
const StatusSchema = z.enum(["en_route", "in_progress", "completed"]);
const AvailabilitySchema = z.enum(["0", "1"]);
const CoordinateSchema = z.string().trim()
  .refine((value) => value === "" || /^-?\d+(?:[.,]\d+)?$/.test(value), "Coordenada inválida.")
  .transform((value) => value === "" ? null : Number(value.replace(",", ".")));
const PerfilTecnicoSchema = z.object({
  bio: z.string().trim().max(500, "A bio pode ter no máximo 500 caracteres."),
  address: z.string().trim().max(300, "O endereço pode ter no máximo 300 caracteres."),
  latitude: CoordinateSchema,
  longitude: CoordinateSchema,
  specialties: z.array(z.string().regex(/^[1-9]\d*$/, "Especialidade inválida."))
    .max(20, "Escolha no máximo 20 especialidades.")
    .transform((values) => [...new Set(values.map(Number))]),
  email_notifications: z.enum(["on"]).nullable().transform((value) => value === "on"),
}).superRefine((profile, context) => {
  if ((profile.latitude === null) !== (profile.longitude === null)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "Preencha latitude e longitude juntas, ou deixe as duas em branco." });
  }
  if (profile.latitude !== null && (!Number.isFinite(profile.latitude) || profile.latitude < -90 || profile.latitude > 90)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "A latitude deve estar entre -90 e 90." });
  }
  if (profile.longitude !== null && (!Number.isFinite(profile.longitude) || profile.longitude < -180 || profile.longitude > 180)) {
    context.addIssue({ code: "custom", path: ["longitude"], message: "A longitude deve estar entre -180 e 180." });
  }
});

async function tecnicoLogado() {
  const session = await getSession();
  if (!session || session.user.role !== "technician") return null;
  return session.user;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

/** Aceita um chamado pendente (precisa ser técnico verificado). */
export async function aceitarChamado(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const serviceId = formData.get("service_id");
  const parsedId = ServiceIdSchema.safeParse(serviceId);
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };

  try {
    const r = await aceitarServico(user, parsedId.data);
    if (!r.ok) return { error: r.error };
    await enviarEmailEvento({
      userId: r.clientId,
      subject: `Chamado ${r.protocol} aceito`,
      text: "Um técnico aceitou seu chamado. Consulte os detalhes do atendimento.",
      href: `/chamados/${parsedId.data}`,
    });
    atualizarTelas();
    return { ok: "Chamado aceito." };
  } catch (err) {
    console.error("aceitarChamado:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Avança o status do chamado: a caminho, em atendimento ou concluído. */
export async function avancarStatus(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const serviceId = formData.get("service_id");
  const status = formData.get("status");
  const parsedId = ServiceIdSchema.safeParse(serviceId);
  const parsedStatus = StatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { error: "Dados inválidos." };

  try {
    const r = await mudarStatusServico(user, parsedId.data, parsedStatus.data);
    if (!r.ok) return { error: r.error };
    if (r.status === "en_route") {
      await enviarEmailEvento({
        userId: r.clientId,
        subject: `O técnico está a caminho · ${r.protocol}`,
        text: "O técnico atualizou o chamado para a caminho.",
        href: `/chamados/${r.serviceId}`,
      });
    }
    if (r.status === "completed") {
      await Promise.all([r.clientId, r.technicianId].filter(Boolean).map((userId) => enviarEmailEvento({
        userId,
        subject: `Chamado ${r.protocol} concluído`,
        text: userId === r.clientId
          ? "O atendimento foi concluído. Abra o chamado para avaliar o serviço."
          : "O atendimento foi marcado como concluído.",
        href: userId === r.clientId ? `/chamados/${r.serviceId}` : `/meus-chamados/${r.serviceId}`,
      })));
    }
    atualizarTelas();
    return { ok: "Status atualizado." };
  } catch (err) {
    console.error("avancarStatus:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Liga/desliga a disponibilidade do técnico na busca. */
export async function alternarDisponibilidade(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const parsed = AvailabilitySchema.safeParse(formData.get("ligar") ?? "0");
  if (!parsed.success) return { error: "Disponibilidade inválida." };
  const ligar = parsed.data === "1";

  try {
    if (ligar) {
      const req = await requisitosDisponibilidade(pool, user.id);
      if (!req) return { error: "Perfil de técnico não encontrado." };
      if (!req.pronto) {
        return { error: `Para ficar disponível falta: ${req.faltando.join("; ").toLowerCase()}.` };
      }
    }
    await pool.query(`update technicians set is_available = $1 where user_id = $2`, [ligar, user.id]);
    atualizarTelas();
    return { ok: ligar ? "Você está disponível para novos chamados." : "Você está indisponível." };
  } catch (err) {
    console.error("alternarDisponibilidade:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Salva bio, endereço, coordenadas e especialidades do técnico. */
export async function salvarPerfilTecnico(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const parsed = PerfilTecnicoSchema.safeParse({
    bio: formData.get("bio") ?? "",
    address: formData.get("address") ?? "",
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
    specialties: formData.getAll("specialties"),
    email_notifications: formData.get("email_notifications"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { bio, address, latitude, longitude, specialties, email_notifications } = parsed.data;

  try {
    await withTransaction(async (db) => {
      await db.query(
        `update technicians set bio = $1, address = $2, latitude = $3, longitude = $4 where user_id = $5`,
        [bio || null, address || null, latitude, longitude, user.id]
      );
      await db.query(`update "user" set email_notifications = $1 where id = $2`, [email_notifications, user.id]);
      await db.query(`delete from technician_specialties where technician_id = $1`, [user.id]);
      if (specialties.length > 0) {
        await db.query(
          `insert into technician_specialties (technician_id, specialty_id)
           select $1, id from specialties where id = any($2::int[])`,
          [user.id, specialties]
        );
      }
      // Se o perfil deixou de cumprir os requisitos, sai da busca automaticamente.
      const req = await requisitosDisponibilidade(db, user.id);
      if (req && req.isAvailable && !req.pronto) {
        await db.query(`update technicians set is_available = false where user_id = $1`, [user.id]);
      }
    });
    atualizarTelas();
    return { ok: "Perfil salvo." };
  } catch (err) {
    console.error("salvarPerfilTecnico:", err);
    return { error: ERRO_GENERICO };
  }
}
