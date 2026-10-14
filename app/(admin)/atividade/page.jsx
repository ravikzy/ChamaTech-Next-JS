import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { formatDateBR } from "@/lib/utils";

const ACTION_LABELS = {
  technician_verified: "Técnico verificado",
  technician_rejected: "Técnico recusado",
  role_changed: "Papel de usuário alterado",
  dispute_resolved: "Disputa encerrada",
  dispute_status_changed: "Status da disputa alterado",
  review_hidden: "Avaliação ocultada após denúncia",
  review_report_dismissed: "Denúncia de avaliação arquivada",
};

export default async function AtividadeAdministrativa() {
  await requireRole("admin");
  const { rows } = await query(
    `select l.action, l.target_id, l.details, l.created_at, u.name as admin_name
       from admin_audit_logs l
       join "user" u on u.id = l.actor_id
      order by l.created_at desc
      limit 50`
  );

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-2xl font-bold">Atividade administrativa</h1>
        <p className="text-sm text-ink/75 mt-1">Ações sensíveis mais recentes, limitadas às últimas 50.</p>
      </div>
      {rows.length === 0 && (
        <Card><p className="text-sm text-ink/75">Nenhuma ação registrada ainda.</p></Card>
      )}
      {rows.map((row, index) => (
        <Card key={`${row.created_at}-${index}`}>
          <p className="font-semibold text-sm">{ACTION_LABELS[row.action] ?? row.action}</p>
          <p className="text-xs text-ink/75 mt-1">
            {row.admin_name} · {formatDateBR(row.created_at)}
            {row.target_id ? ` · Registro ${row.target_id}` : ""}
          </p>
          {row.details?.status && <p className="text-xs text-ink/75 mt-2">Status: {row.details.status}</p>}
          {row.details?.fromRole && row.details?.toRole && (
            <p className="text-xs text-ink/75 mt-2">{row.details.fromRole} → {row.details.toRole}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
