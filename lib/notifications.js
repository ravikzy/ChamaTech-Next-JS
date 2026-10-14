
export async function criarNotificacao(db, { userId, title, body = null, href = null }) {
  if (!userId) return;
  await db.query(
    `insert into notifications (user_id, title, body, href) values ($1, $2, $3, $4)`,
    [userId, title, body, href]
  );
}
