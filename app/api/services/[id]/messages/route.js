import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const IdSchema = z.string().uuid();
const MessageSchema = z.object({ message: z.string().trim().min(1).max(2000) }).strict();

async function contexto(id, session) {
  const { rows } = await query(
    `select id, client_id, technician_id, accepted_at
       from services where id = $1`,
    [id]
  );
  const service = rows[0];
  if (!service) return { response: NextResponse.json({ error: "Chamado não encontrado." }, { status: 404 }) };
  const ehAdmin = session.user.role === "admin";
  const ehCliente = session.user.role === "client" && service.client_id === session.user.id;
  const ehTecnico = session.user.role === "technician" && service.technician_id === session.user.id;
  if (!ehAdmin && !ehCliente && !ehTecnico) {
    return { response: NextResponse.json({ error: "Você não tem acesso a esta conversa." }, { status: 403 }) };
  }
  if (!service.accepted_at) {
    return { response: NextResponse.json({ error: "A conversa fica disponível depois que o técnico aceita." }, { status: 409 }) };
  }
  return { service, ehAdmin, ehCliente, ehTecnico };
}

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Entre na sua conta para abrir a conversa." }, { status: 401 });
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) return NextResponse.json({ error: "Chamado inválido." }, { status: 400 });

  const access = await contexto(id, session);
  if (access.response) return access.response;
  const { rows } = await query(
    `select c.id, c.sender_id, c.message, c.sent_at, u.name as sender_name
       from (select id, sender_id, message, sent_at from chats where service_id = $1 order by sent_at desc limit 100) c
       join "user" u on u.id = c.sender_id
      order by c.sent_at asc`,
    [id]
  );
  return NextResponse.json({ messages: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Entre na sua conta para enviar uma mensagem." }, { status: 401 });
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) return NextResponse.json({ error: "Chamado inválido." }, { status: 400 });

  const access = await contexto(id, session);
  if (access.response) return access.response;
  if (access.ehAdmin) return NextResponse.json({ error: "Administradores podem ler a conversa, mas não enviar mensagens." }, { status: 403 });
  if (!checkRateLimit(`chat:send:${session.user.id}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Você enviou mensagens muito rápido. Aguarde um minuto." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  }
  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A mensagem deve ter de 1 a 2000 caracteres." }, { status: 422 });
  const receiverId = access.ehCliente ? access.service.technician_id : access.service.client_id;

  const { rows } = await query(
    `insert into chats (service_id, sender_id, receiver_id, message)
     values ($1, $2, $3, $4)
     returning id, sender_id, message, sent_at`,
    [id, session.user.id, receiverId, parsed.data.message]
  );
  return NextResponse.json({ message: { ...rows[0], sender_name: session.user.name } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
