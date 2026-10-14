import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";

const TechnicianIdSchema = z.string().min(1).max(128);

export async function GET(request, { params }) {
  const { id } = await params;
  if (!TechnicianIdSchema.safeParse(id).success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { rows } = await query(
    `select t.user_id, u.name, t.bio, t.average_rating, t.total_reviews, t.is_verified
     from technicians t join "user" u on u.id = t.user_id
     where t.user_id = $1`,
    [id]
  );
  if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ technician: rows[0] });
}
