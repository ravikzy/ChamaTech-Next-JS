import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { avaliarServico } from "@/lib/services";

const ReviewSchema = z.object({
  service_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { service_id, rating, comment } = parsed.data;
  const resultado = await avaliarServico(session.user, { serviceId: service_id, rating, comment });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
