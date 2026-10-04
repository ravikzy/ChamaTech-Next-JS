import { query } from "@/lib/db";
import { NotificationBellClient } from "@/components/layout/NotificationBellClient";

/** Busca a contagem inicial no servidor e entrega ao sino (client). */
export async function NotificationBell({ userId }) {
  let unread = 0;
  try {
    const { rows } = await query(
      `select count(*)::int as total from notifications where user_id = $1 and read = false`,
      [userId]
    );
    unread = rows[0].total;
  } catch {
    // o sino nunca deve derrubar a página
  }
  return <NotificationBellClient initialCount={unread} />;
}
