import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

const ACTION_LABELS = {
  technician_verified: "Técnico verificado",
  technician_rejected: "Técnico recusado",
  role_changed: "Papel de usuário alterado",
  dispute_resolved: "Disputa encerrada",
  dispute_status_changed: "Status de disputa alterado",
  review_hidden: "Avaliação ocultada",
  review_report_dismissed: "Denúncia arquivada",
};

export default async function PainelAdmin() {
  await requireRole("admin");
  const [summaryResult, statusResult, techniciansResult, disputesResult, reviewsResult, activityResult] = await Promise.all([
    query(
      `select
         (select count(*)::int from "user") as users,
         (select count(*)::int from technicians where is_verified = false) as pending_technicians,
         (select count(*)::int from disputes where status in ('open', 'reviewing')) as open_disputes,
         (select count(*)::int from review_reports where status = 'open') as reported_reviews,
         (select count(*)::int from services) as services`
    ),
    query(`select status, count(*)::int as total from services group by status`),
    query(
      `select t.user_id, u.name from technicians t join "user" u on u.id = t.user_id
        where t.is_verified = false order by t.created_at asc limit 5`
    ),
    query(
      `select d.id, sv.protocol, d.created_at from disputes d join services sv on sv.id = d.service_id
        where d.status in ('open', 'reviewing') order by d.created_at asc limit 5`
    ),
    query(
      `select rr.review_id, count(*)::int as reports
         from review_reports rr where rr.status = 'open'
        group by rr.review_id order by min(rr.created_at) asc limit 5`
    ),
    query(
      `select l.action, l.target_id, l.created_at, u.name as admin_name
         from admin_audit_logs l join "user" u on u.id = l.actor_id
        order by l.created_at desc limit 5`
    ),
  ]);
  const summary = summaryResult.rows[0];
  const counts = new Map(statusResult.rows.map((row) => [row.status, row.total]));
  const statuses = Object.keys(STATUS_LABELS).map((status) => ({ status, total: counts.get(status) ?? 0 }));
  const largestStatus = Math.max(1, ...statuses.map((item) => item.total));

  return (
    <div className="space-y-6">
      <section aria-label="Indicadores">
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            ["Usuários", summary.users],
            ["Técnicos pendentes", summary.pending_technicians],
            ["Chamados", summary.services],
            ["Disputas abertas", summary.open_disputes],
            ["Denúncias de avaliação", summary.reported_reviews],
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-xs uppercase text-ink/75 font-display">{label}</p>
              <p className="text-3xl font-display mt-1">{value}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display text-lg font-semibold mb-4">Chamados por status</h2>
          <div className="space-y-3">
            {statuses.map(({ status, total }) => (
              <div key={status} className="grid grid-cols-[110px_1fr_2rem] items-center gap-3 text-sm">
                <span>{STATUS_LABELS[status]}</span>
                <div className="h-2 rounded-full bg-workbench-soft overflow-hidden" role="img" aria-label={`${total} chamados: ${STATUS_LABELS[status]}`}>
                  <div className="h-full rounded-full bg-copper" style={{ width: `${(total / largestStatus) * 100}%` }} />
                </div>
                <span className="text-right tabular-nums">{total}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-lg font-semibold">Buscar usuários</h2>
            <Link href="/usuarios" className="text-sm text-copper-light underline underline-offset-4">Ver lista completa</Link>
          </div>
          <form action="/usuarios" className="space-y-3">
            <label htmlFor="usuario-q" className="block text-sm">Nome ou e-mail</label>
            <input id="usuario-q" name="q" type="search" maxLength={100} className="w-full rounded-control border border-cream/20 bg-workbench px-3 py-2.5 text-sm text-cream focus-visible:ring-2 focus-visible:ring-focus" />
            <label htmlFor="usuario-papel" className="block text-sm">Perfil</label>
            <select id="usuario-papel" name="papel" className="w-full rounded-control border border-cream/20 bg-workbench px-3 py-2.5 text-sm text-cream focus-visible:ring-2 focus-visible:ring-focus">
              <option value="">Todos</option>
              <option value="client">Clientes</option>
              <option value="technician">Técnicos</option>
              <option value="admin">Administradores</option>
            </select>
            <Button type="submit">Pesquisar</Button>
          </form>
        </Card>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Fila de tarefas</h2>
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold">Técnicos a verificar</h3>
              <Badge tone={techniciansResult.rows.length ? "en_route" : "completed"}>{summary.pending_technicians}</Badge>
            </div>
            {techniciansResult.rows.length ? (
              <ul className="mt-3 divide-y divide-cream/10">
                {techniciansResult.rows.map((technician) => <li key={technician.user_id} className="py-2 text-sm">{technician.name}</li>)}
              </ul>
            ) : <p className="text-sm text-ink/75 mt-3">Nenhum perfil pendente.</p>}
            <Link href="/tecnicos-pendentes" className="inline-block mt-3 text-sm text-copper-light underline underline-offset-4">Abrir fila de técnicos</Link>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold">Disputas abertas</h3>
              <Badge tone={disputesResult.rows.length ? "disputed" : "completed"}>{summary.open_disputes}</Badge>
            </div>
            {disputesResult.rows.length ? (
              <ul className="mt-3 divide-y divide-cream/10">
                {disputesResult.rows.map((dispute) => <li key={dispute.id} className="py-2 text-sm">{dispute.protocol} · {formatDateBR(dispute.created_at)}</li>)}
              </ul>
            ) : <p className="text-sm text-ink/75 mt-3">Nenhuma disputa aguardando análise.</p>}
            <Link href="/disputas" className="inline-block mt-3 text-sm text-copper-light underline underline-offset-4">Abrir fila de disputas</Link>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold">Avaliações denunciadas</h3>
              <Badge tone={reviewsResult.rows.length ? "disputed" : "completed"}>{summary.reported_reviews}</Badge>
            </div>
            {reviewsResult.rows.length ? (
              <ul className="mt-3 divide-y divide-cream/10">
                {reviewsResult.rows.map((review) => <li key={review.review_id} className="py-2 text-sm">{review.reports} {review.reports === 1 ? "denúncia" : "denúncias"}</li>)}
              </ul>
            ) : <p className="text-sm text-ink/75 mt-3">Nenhuma avaliação aguardando moderação.</p>}
            <Link href="/avaliacoes" className="inline-block mt-3 text-sm text-copper-light underline underline-offset-4">Abrir fila de avaliações</Link>
          </Card>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-lg font-semibold">Atividade recente</h2>
          <Link href="/atividade" className="text-sm text-copper-light underline underline-offset-4">Ver atividade</Link>
        </div>
        {activityResult.rows.length ? (
          <div className="space-y-2">
            {activityResult.rows.map((activity, index) => (
              <Card key={`${activity.created_at}-${index}`} className="flex flex-wrap justify-between gap-2 py-3">
                <p className="text-sm">{ACTION_LABELS[activity.action] ?? activity.action} · {activity.admin_name}</p>
                <p className="text-xs text-ink/75">{formatDateBR(activity.created_at)}</p>
              </Card>
            ))}
          </div>
        ) : <Card><p className="text-sm text-ink/75">Nenhuma ação administrativa registrada.</p></Card>}
      </section>
    </div>
  );
}
