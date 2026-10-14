import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isUuid } from "@/lib/session";
import { aceitarServico, mudarStatusServico } from "@/lib/services";

const UpdateSchema = z.object({
  status: z.enum(["pending", "accepted", "en_route", "in_progress", "completed", "cancelled", "disputed"]),
  reason: z.string().trim().max(1000).optional(), // motivo — obrigatório ao abrir disputa
});

// PATCH /api/services/:id — transição de status.
// Quem pode o quê (cliente dono, técnico do chamado, admin) é decidido em
// lib/services.js; aqui só traduzimos o resultado em resposta HTTP.
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chamado não encontrado." }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 422 });

  const { status, reason } = parsed.data;

  // Técnico aceitando um chamado pendente: regra própria (precisa estar verificado).
  const resultado =
    status === "accepted" && session.user.role === "technician"
      ? await aceitarServico(session.user, id)
      : await mudarStatusServico(session.user, id, status, { motivo: reason });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({ ok: true });
}
