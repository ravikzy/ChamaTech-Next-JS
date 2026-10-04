"use server";

import { revalidatePath } from "next/cache";
import { getSession, isUuid } from "@/lib/session";
import { query } from "@/lib/db";

/** Marca uma notificação do usuário logado como lida. */
export async function marcarComoLida(formData) {
  const session = await getSession();
  if (!session) return;

  const id = formData.get("id");
  if (!isUuid(id)) return;

  await query(`update notifications set read = true where id = $1 and user_id = $2`, [id, session.user.id]);
  revalidatePath("/", "layout");
}

/** Marca todas as notificações do usuário logado como lidas. */
export async function marcarTodasComoLidas() {
  const session = await getSession();
  if (!session) return;

  await query(`update notifications set read = true where user_id = $1 and read = false`, [session.user.id]);
  revalidatePath("/", "layout");
}
