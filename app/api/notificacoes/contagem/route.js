import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/notificacoes/contagem — quantidade de notificações não lidas
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { rows } = await query(
    `select count(*)::int as total from notifications where user_id = $1 and read = false`,
    [session.user.id]
  );
  return NextResponse.json({ unread: rows[0].total });
}
