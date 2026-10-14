import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { moderarAvaliacaoAction } from "@/app/actions/admin";
import { formatDateBR } from "@/lib/utils";
import { rotulosDasTags } from "@/lib/reviews";

export default async function AvaliacoesDenunciadas() {
  await requireRole("admin");
  const { rows } = await query(
    `select rr.id as report_id, rr.reason as report_reason, rr.created_at as reported_at,
            r.id as review_id, r.rating, r.comment, r.tags, r.created_at as review_created_at,
            client.name as client_name, technician.name as technician_name,
            reporter.name as reporter_name
       from review_reports rr
       join reviews r on r.id = rr.review_id
       join "user" client on client.id = r.client_id
       join "user" technician on technician.id = r.technician_id
       join "user" reporter on reporter.id = rr.reporter_id
      where rr.status = 'open'
      order by rr.created_at asc
      limit 100`
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Avaliações denunciadas</h1>
        <p className="text-sm text-ink/75 mt-1">Ocultar uma avaliação impede que ela apareça no perfil e no cálculo da nota; o registro permanece no banco.</p>
      </div>
      {rows.length === 0 && <Card><p className="text-sm text-ink/75">Nenhuma denúncia aguardando análise.</p></Card>}
      {rows.map((row) => (
        <Card key={row.report_id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display font-semibold">{"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)}</p>
            <Badge tone="en_route">Denúncia aberta</Badge>
          </div>
          {row.comment && <p className="text-sm mt-3">“{row.comment}”</p>}
          {row.tags?.length > 0 && <p className="text-xs text-ink/75 mt-2">{rotulosDasTags(row.tags).join(" · ")}</p>}
          <p className="text-xs text-ink/75 mt-3">Atendimento por {row.technician_name} · Avaliação de {row.client_name}</p>
          <p className="text-xs text-ink/75">Denunciada por {row.reporter_name} em {formatDateBR(row.reported_at)}</p>
          <div className="mt-3 rounded-control border border-danger/30 bg-danger/10 p-3">
            <p className="text-xs font-semibold">Motivo da denúncia</p>
            <p className="text-sm mt-1 whitespace-pre-line">{row.report_reason}</p>
          </div>
          <ActionForm action={moderarAvaliacaoAction} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="report_id" value={row.report_id} />
            <SubmitButton name="decision" value="hide" variant="danger" pendingText="Salvando...">Ocultar avaliação</SubmitButton>
            <SubmitButton name="decision" value="keep" variant="outline" pendingText="Salvando...">Manter avaliação</SubmitButton>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}
