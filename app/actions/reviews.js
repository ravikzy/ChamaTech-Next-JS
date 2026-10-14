"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { denunciarAvaliacao, responderAvaliacao } from "@/lib/services";

const ReviewIdSchema = z.string().uuid("Avaliação inválida.");
const ReplySchema = z.string().trim().min(2, "Escreva uma resposta.").max(500, "A resposta pode ter no máximo 500 caracteres.");
const ReportSchema = z.string().trim().min(5, "Explique o motivo da denúncia.").max(500, "O motivo pode ter no máximo 500 caracteres.");

export async function responderAvaliacaoAction(_prev, formData) {
  const session = await getSession();
  if (!session || session.user.role !== "technician") return { error: "Apenas técnicos podem responder avaliações." };

  const reviewId = ReviewIdSchema.safeParse(formData.get("review_id"));
  const reply = ReplySchema.safeParse(formData.get("reply") ?? "");
  if (!reviewId.success || !reply.success) return { error: reviewId.error?.issues[0]?.message ?? reply.error.issues[0].message };

  try {
    const result = await responderAvaliacao(session.user, { reviewId: reviewId.data, reply: reply.data });
    if (!result.ok) return { error: result.error };
    revalidatePath("/painel-tecnico");
    revalidatePath("/tecnicos");
    return { ok: "Resposta publicada." };
  } catch (error) {
    console.error("responderAvaliacaoAction:", error);
    return { error: "Não foi possível publicar a resposta. Tente novamente." };
  }
}

export async function denunciarAvaliacaoAction(_prev, formData) {
  const session = await getSession();
  if (!session || !["client", "technician"].includes(session.user.role)) {
    return { error: "Entre na sua conta para denunciar uma avaliação." };
  }

  const reviewId = ReviewIdSchema.safeParse(formData.get("review_id"));
  const reason = ReportSchema.safeParse(formData.get("reason") ?? "");
  if (!reviewId.success || !reason.success) return { error: reviewId.error?.issues[0]?.message ?? reason.error.issues[0].message };
  if (!checkRateLimit(`review:report:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return { error: "Você enviou muitas denúncias recentemente. Tente novamente mais tarde." };
  }

  try {
    const result = await denunciarAvaliacao(session.user, { reviewId: reviewId.data, reason: reason.data });
    if (!result.ok) return { error: result.error };
    revalidatePath("/tecnicos");
    revalidatePath("/painel-tecnico");
    return { ok: "Denúncia enviada para análise." };
  } catch (error) {
    if (error?.code === "23505") return { error: "Você já denunciou esta avaliação." };
    console.error("denunciarAvaliacaoAction:", error);
    return { error: "Não foi possível enviar a denúncia. Tente novamente." };
  }
}
