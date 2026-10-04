
export async function criarNotificacao(db, { userId, title, body = null }) {
  if (!userId) return;
  await db.query(
    `insert into notifications (user_id, title, body) values ($1, $2, $3)`,
    [userId, title, body]
  );
}
