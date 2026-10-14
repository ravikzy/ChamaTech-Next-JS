"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { criarChamado, mudarStatusServico, avaliarServico } from "@/lib/services";
import { checkRateLimit } from "@/lib/rate-limit";
import { REVIEW_TAGS } from "@/lib/reviews";
import { enviarEmailEvento } from "@/lib/email";

const ERRO_GENERICO = "Não foi possível concluir a ação. Tente novamente.";

async function clienteLogado() {
  const session = await getSession();
  if (!session || session.user.role !== "client") return null;
  return session.user;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

const ChamadoSchema = z.object({
  technician_id: z.string().trim().min(1, "Técnico inválido.").max(128, "Técnico inválido."),
  description: z
    .string()
    .trim()
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .max(1000, "A descrição pode ter no máximo 1000 caracteres."),
  address: z.string().trim().max(300, "O endereço pode ter no máximo 300 caracteres."),
  is_emergency: z.enum(["on"]).nullable().transform((value) => value === "on"),
});
const IdSchema = z.string().uuid("Chamado inválido.");
const DisputaSchema = z.object({
  service_id: IdSchema,
  reason: z.string().trim().min(5, "Descreva o motivo da disputa (mínimo de 5 caracteres).")
    .max(1000, "O motivo pode ter no máximo 1000 caracteres."),
});
const AvaliacaoSchema = z.object({
  service_id: IdSchema,
  rating: z.string().regex(/^[1-5]$/, "Escolha uma nota de 1 a 5.").transform(Number),
  comment: z.string().trim().max(500, "O comentário pode ter no máximo 500 caracteres."),
  tags: z.array(z.enum(REVIEW_TAGS)).max(REVIEW_TAGS.length),
});
const PerfilClienteSchema = z.object({
  phone: z.string().trim().min(10).max(30).refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  }, "Informe um telefone válido com DDD, ex.: (11) 91234-5678."),
  address: z.string().trim().max(300, "O endereço pode ter no máximo 300 caracteres."),
  email_notifications: z.enum(["on"]).nullable().transform((value) => value === "on"),
});

/** Abre um chamado direcionado a um técnico. */
export async function abrirChamado(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para abrir um chamado." };

  const parsed = ChamadoSchema.safeParse({
    technician_id: formData.get("technician_id"),
    description: formData.get("description") ?? "",
    address: formData.get("address") ?? "",
    is_emergency: formData.get("is_emergency"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!checkRateLimit(`service:create:${user.id}`, 5, 60 * 60 * 1000)) {
    return { error: "Você abriu muitos chamados recentemente. Tente novamente mais tarde." };
  }

  let id;
  try {
    const r = await criarChamado(user, {
      technicianId: parsed.data.technician_id,
      description: parsed.data.description,
      address: parsed.data.address || null,
      isEmergency: parsed.data.is_emergency,
    });
    if (!r.ok) return { error: r.error };
    id = r.service.id;
    await enviarEmailEvento({
      userId: parsed.data.technician_id,
      subject: `Novo chamado ${r.service.protocol}`,
      text: "Você recebeu uma nova solicitação de atendimento.",
      href: "/solicitacoes",
    });
  } catch (err) {
    console.error("abrirChamado:", err);
    return { error: ERRO_GENERICO };
  }

  atualizarTelas();
  redirect(`/chamados/${id}`);
}

/** Cancela o chamado (permitido enquanto não está em atendimento). */
export async function cancelarChamado(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para continuar." };

  const serviceId = formData.get("service_id");
  const parsedId = IdSchema.safeParse(serviceId);
  if (!parsedId.success) return { error: parsedId.error.issues[0].message };

  try {
    const r = await mudarStatusServico(user, parsedId.data, "cancelled");
    if (!r.ok) return { error: r.error };
    atualizarTelas();
    return { ok: "Chamado cancelado." };
  } catch (err) {
    console.error("cancelarChamado:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Abre uma disputa (insere em disputes e muda o status para "Em disputa"). */
export async function abrirDisputa(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para continuar." };

  const parsed = DisputaSchema.safeParse({
    service_id: formData.get("service_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const r = await mudarStatusServico(user, parsed.data.service_id, "disputed", { motivo: parsed.data.reason });
    if (!r.ok) return { error: r.error };
    await Promise.all([r.clientId, r.technicianId].filter(Boolean).map((userId) => enviarEmailEvento({
      userId,
      subject: `Disputa aberta no chamado ${r.protocol}`,
      text: "Uma disputa foi aberta. Consulte os detalhes e as atualizações do chamado.",
      href: userId === r.clientId ? `/chamados/${r.serviceId}` : `/meus-chamados/${r.serviceId}`,
    })));
    atualizarTelas();
    return { ok: "Disputa aberta. Um administrador vai analisar." };
  } catch (err) {
    console.error("abrirDisputa:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Avalia um chamado concluído (nota de 1 a 5 e comentário opcional). */
export async function avaliarChamado(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para continuar." };

  const parsed = AvaliacaoSchema.safeParse({
    service_id: formData.get("service_id"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
    tags: formData.getAll("tags"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!checkRateLimit(`review:create:${user.id}`, 5, 60 * 60 * 1000)) {
    return { error: "Você enviou muitas avaliações recentemente. Tente novamente mais tarde." };
  }

  try {
    const r = await avaliarServico(user, {
      serviceId: parsed.data.service_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      tags: parsed.data.tags,
    });
    if (!r.ok) return { error: r.error };
    atualizarTelas();
    return { ok: "Obrigado pela avaliação!" };
  } catch (err) {
    console.error("avaliarChamado:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Atualiza telefone e endereço do cliente. */
export async function salvarPerfilCliente(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para continuar." };

  const parsed = PerfilClienteSchema.safeParse({
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    email_notifications: formData.get("email_notifications"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await query(`update "user" set phone = $1, email_notifications = $2 where id = $3`, [parsed.data.phone, parsed.data.email_notifications, user.id]);
    await query(
      `insert into clients (user_id, address) values ($1, $2)
       on conflict (user_id) do update set address = excluded.address`,
      [user.id, parsed.data.address || null]
    );
    atualizarTelas();
    return { ok: "Perfil salvo." };
  } catch (err) {
    console.error("salvarPerfilCliente:", err);
    return { error: ERRO_GENERICO };
  }
}
