import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { atualizarDisputa } from "@/app/actions/admin";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

const DISPUTE_TONE = { open: "disputed", reviewing: "en_route", resolved: "completed", dismissed: "cancelled" };
const DISPUTE_LABEL = { open: "Aberta", reviewing: "Em análise", resolved: "Resolvida", dismissed: "Arquivada" };

export default async function Disputas() {
  await requireRole("admin");
  const { rows } = await query(
    `select d.id, d.reason, d.status, d.resolution_notes, d.created_at, d.resolved_at,
            sv.protocol, sv.status as service_status,
            u.name as aberto_por, uc.name as cliente, ut.name as tecnico
       from disputes d
       join services sv on sv.id = d.service_id
       join "user" u on u.id = d.opened_by
       join "user" uc on uc.id = sv.client_id
       left join "user" ut on ut.id = sv.technician_id
      order by (d.status in ('open','reviewing')) desc, d.created_at desc`
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <Card>
          <p className="text-sm text-ink/70">Nenhuma disputa registrada.</p>
        </Card>
      )}
      {rows.map((d) => (
        <Card key={d.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ProtocolBadge protocol={d.protocol} />
                <Badge tone={d.service_status}>{STATUS_LABELS[d.service_status]}</Badge>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line">{d.reason}</p>
              <p className="text-xs text-ink/50 mt-1">
                Aberta por {d.aberto_por} · {formatDateBR(d.created_at)}
              </p>
              <p className="text-xs text-ink/50">
                Cliente: {d.cliente} · Técnico: {d.tecnico ?? "—"}
              </p>
              {d.resolved_at && (
                <p className="text-xs text-ink/50">Encerrada em {formatDateBR(d.resolved_at)}</p>
              )}
            </div>
            <Badge tone={DISPUTE_TONE[d.status]}>{DISPUTE_LABEL[d.status] ?? d.status}</Badge>
          </div>

          <ActionForm action={atualizarDisputa} className="mt-4 border-t border-ink/10 pt-4 space-y-3">
            <input type="hidden" name="dispute_id" value={d.id} />
            <div className="grid sm:grid-cols-[200px_1fr] gap-3">
              <label className="block">
                <span className="block text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-1.5">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={d.status === "open" ? "reviewing" : d.status}
                  className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-copper"
                >
                  <option value="reviewing">Em análise</option>
                  <option value="resolved">Resolvida</option>
                  <option value="dismissed">Arquivada</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-1.5">
                  Notas de resolução
                </span>
                <textarea
                  name="resolution_notes"
                  rows={2}
                  maxLength={1000}
                  defaultValue={d.resolution_notes ?? ""}
                  placeholder="Obrigatório ao resolver ou arquivar"
                  className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper"
                />
              </label>
            </div>
            <SubmitButton variant="outline" pendingText="Salvando...">
              Salvar
            </SubmitButton>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}
