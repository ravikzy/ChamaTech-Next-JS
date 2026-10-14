"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

const NotificationIdSchema = z.string().uuid();

/** Marca uma notificação do usuário logado como lida. */
export async function marcarComoLida(formData) {
  const session = await getSession();
  if (!session) return;

  const id = formData.get("id");
  const parsedId = NotificationIdSchema.safeParse(id);
  if (!parsedId.success) return;

  await query(`update notifications set read = true where id = $1 and user_id = $2`, [parsedId.data, session.user.id]);
  revalidatePath("/", "layout");
}

/** Marca todas as notificações do usuário logado como lidas. */
export async function marcarTodasComoLidas() {
  const session = await getSession();
  if (!session) return;

  await query(`update notifications set read = true where user_id = $1 and read = false`, [session.user.id]);
  revalidatePath("/", "layout");
}
