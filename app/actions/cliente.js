"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, isUuid } from "@/lib/session";
import { query } from "@/lib/db";
import { criarChamado, mudarStatusServico, avaliarServico } from "@/lib/services";

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
  technician_id: z.string().min(1, "Técnico inválido."),
  description: z
    .string()
    .trim()
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .max(1000, "A descrição pode ter no máximo 1000 caracteres."),
  address: z.string().trim().max(300, "O endereço pode ter no máximo 300 caracteres."),
});

/** Abre um chamado direcionado a um técnico. */
export async function abrirChamado(_prev, formData) {
  const user = await clienteLogado();
  if (!user) return { error: "Faça login como cliente para abrir um chamado." };

  const parsed = ChamadoSchema.safeParse({
    technician_id: formData.get("technician_id"),
    description: formData.get("description") ?? "",
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let id;
  try {
    const r = await criarChamado(user, {
      technicianId: parsed.data.technician_id,
      description: parsed.data.description,
      address: parsed.data.address || null,
      isEmergency: formData.get("is_emergency") === "on",
    });
    if (!r.ok) return { error: r.error };
    id = r.service.id;
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
  if (!isUuid(serviceId)) return { error: "Chamado inválido." };

  try {
    const r = await mudarStatusServico(user, serviceId, "cancelled");
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

  const serviceId = formData.get("service_id");
  if (!isUuid(serviceId)) return { error: "Chamado inválido." };

  const motivo = String(formData.get("reason") ?? "").trim();
  if (motivo.length < 5) return { error: "Descreva o motivo da disputa (mínimo de 5 caracteres)." };
  if (motivo.length > 1000) return { error: "O motivo pode ter no máximo 1000 caracteres." };

  try {
    const r = await mudarStatusServico(user, serviceId, "disputed", { motivo });
    if (!r.ok) return { error: r.error };
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

  const serviceId = formData.get("service_id");
  if (!isUuid(serviceId)) return { error: "Chamado inválido." };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Escolha uma nota de 1 a 5." };
  }
  const comment = String(formData.get("comment") ?? "").trim();
  if (comment.length > 500) return { error: "O comentário pode ter no máximo 500 caracteres." };

  try {
    const r = await avaliarServico(user, { serviceId, rating, comment });
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

  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const digitos = phone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 11) {
    return { error: "Informe um telefone válido com DDD, ex.: (11) 91234-5678." };
  }
  if (address.length > 300) return { error: "O endereço pode ter no máximo 300 caracteres." };

  try {
    await query(`update "user" set phone = $1 where id = $2`, [phone, user.id]);
    await query(
      `insert into clients (user_id, address) values ($1, $2)
       on conflict (user_id) do update set address = excluded.address`,
      [user.id, address || null]
    );
    atualizarTelas();
    return { ok: "Perfil salvo." };
  } catch (err) {
    console.error("salvarPerfilCliente:", err);
    return { error: ERRO_GENERICO };
  }
}
