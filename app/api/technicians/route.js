import { NextResponse } from "next/server";
import { buscarTecnicos } from "@/lib/technicians";

// GET /api/technicians?lat=&lng=&especialidade=
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? NaN);
  const lng = Number(searchParams.get("lng") ?? NaN);
  const especialidade = searchParams.get("especialidade") || undefined;

  const technicians = await buscarTecnicos({
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    especialidade,
  });

  return NextResponse.json({ technicians });
}
