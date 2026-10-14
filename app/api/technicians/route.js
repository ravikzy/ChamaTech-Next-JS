import { NextResponse } from "next/server";
import { z } from "zod";
import { buscarTecnicos } from "@/lib/technicians";

const SearchSchema = z.object({
  lat: z.string().trim().regex(/^-?\d+(?:\.\d+)?$/).transform(Number).pipe(z.number().min(-90).max(90)).optional(),
  lng: z.string().trim().regex(/^-?\d+(?:\.\d+)?$/).transform(Number).pipe(z.number().min(-180).max(180)).optional(),
  especialidade: z.string().trim().max(50).optional(),
}).superRefine((data, context) => {
  if ((data.lat === undefined) !== (data.lng === undefined)) {
    context.addIssue({ code: "custom", path: ["lat"], message: "Envie latitude e longitude juntas." });
  }
});

// GET /api/technicians?lat=&lng=&especialidade=
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsed = SearchSchema.safeParse({
    lat: searchParams.has("lat") ? searchParams.get("lat") : undefined,
    lng: searchParams.has("lng") ? searchParams.get("lng") : undefined,
    especialidade: searchParams.get("especialidade") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const technicians = await buscarTecnicos({
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    especialidade: parsed.data.especialidade || undefined,
  });

  return NextResponse.json({ technicians });
}
