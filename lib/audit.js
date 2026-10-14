export async function registrarAuditoria(db, { actorId, action, targetId = null, details = {} }) {
  await db.query(
    `insert into admin_audit_logs (actor_id, action, target_id, details)
     values ($1, $2, $3, $4::jsonb)`,
    [actorId, action, targetId, JSON.stringify(details)]
  );
}
