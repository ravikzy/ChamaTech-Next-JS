import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { criarChamado } from "@/lib/services";
import { checkRateLimit } from "@/lib/rate-limit";

const CreateServiceSchema = z.object({
  technician_id: z.string().trim().min(1).max(128).optional(),
  specialty_id: z.number().int().positive().optional(),
  description: z.string().trim().min(10, "Descreva o problema com pelo menos 10 caracteres.").max(1000),
  is_emergency: z.boolean().optional(),
  address: z.string().trim().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).superRefine((data, context) => {
  if ((data.latitude === undefined) !== (data.longitude === undefined)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "Envie latitude e longitude juntas." });
  }
});

// POST /api/services — cliente autenticado abre um chamado
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = CreateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  if (!checkRateLimit(`service:create:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const d = parsed.data;
  const resultado = await criarChamado(session.user, {
    technicianId: d.technician_id,
    specialtyId: d.specialty_id,
    description: d.description,
    isEmergency: d.is_emergency,
    address: d.address || null,
    latitude: d.latitude,
    longitude: d.longitude,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({ service: resultado.service }, { status: 201 });
}

// GET /api/services — lista os chamados do usuário logado (papel-consciente)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const column = session.user.role === "technician" ? "technician_id" : "client_id";
  const { rows } = await query(
    `select id, protocol, description, status, requested_at from services
     where ${column} = $1 order by requested_at desc`,
    [session.user.id]
  );

  return NextResponse.json({ services: rows });
}
