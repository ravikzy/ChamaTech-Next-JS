import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { avaliarServico } from "@/lib/services";
import { checkRateLimit } from "@/lib/rate-limit";
import { REVIEW_TAGS } from "@/lib/reviews";

const ReviewSchema = z.object({
  service_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  tags: z.array(z.enum(REVIEW_TAGS)).max(REVIEW_TAGS.length).optional().default([]),
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
  if (!checkRateLimit(`review:create:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { service_id, rating, comment, tags } = parsed.data;
  const resultado = await avaliarServico(session.user, { serviceId: service_id, rating, comment, tags });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
