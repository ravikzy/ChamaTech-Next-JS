import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

const LINHA_DO_TEMPO = ["pending", "accepted", "en_route", "in_progress", "completed"];
const PROXIMA_ACAO = {
  pending: "A solicitação foi enviada. Aguarde o aceite de um técnico.",
  accepted: "Um técnico aceitou. Combine os detalhes do atendimento pelo chamado.",
  en_route: "O técnico está a caminho. Acompanhe as atualizações do chamado.",
  in_progress: "O atendimento está em andamento. Depois, avalie o serviço no chamado.",
  disputed: "A equipe está analisando a disputa. Acompanhe as notificações.",
};

export default async function ClientPainel() {
  const session = await requireRole("client");
  const userId = session.user.id;

  const [{ rows: resumo }, { rows: recentes }, { rows: ativoRows }, { rows: pendentesAvaliacao }] = await Promise.all([
    query(
      `select status, count(*)::int as total
         from services where client_id = $1 group by status`,
      [userId]
    ),
    query(
      `select sv.id, sv.protocol, sv.description, sv.status, sv.requested_at, u.name as technician_name
         from services sv
         left join "user" u on u.id = sv.technician_id
        where sv.client_id = $1
        order by sv.requested_at desc
        limit 5`,
      [userId]
    ),
    query(
      `select sv.id, sv.protocol, sv.description, sv.status, sv.requested_at,
              u.name as technician_name,
              coalesce((select json_agg(json_build_object('status', h.status, 'changed_at', h.changed_at) order by h.changed_at)
                          from service_status_history h where h.service_id = sv.id), '[]'::json) as timeline
         from services sv
         left join "user" u on u.id = sv.technician_id
        where sv.client_id = $1 and sv.status in ('pending','accepted','en_route','in_progress','disputed')
        order by sv.requested_at desc limit 1`,
      [userId]
    ),
    query(
      `select sv.id, sv.protocol, sv.description, sv.completed_at
         from services sv
        where sv.client_id = $1 and sv.status = 'completed'
          and not exists (select 1 from reviews r where r.service_id = sv.id)
        order by sv.completed_at desc limit 5`,
      [userId]
    ),
  ]);

  const abertos = resumo.filter((r) => !["completed", "cancelled"].includes(r.status));
  const ativo = ativoRows[0];
  const linhaAtiva = ativo?.status === "disputed"
    ? [...LINHA_DO_TEMPO.slice(0, 4), "disputed", "completed"]
    : LINHA_DO_TEMPO;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button as={Link} href="/tecnicos">Novo chamado</Button>
        <Button as={Link} href="/tecnicos?emergencia=1" variant="amber" className="text-ink">
          Emergência
        </Button>
      </div>

      {ativo && (
        <section aria-labelledby="chamado-ativo-titulo">
          <Card className="border-copper/35">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="chamado-ativo-titulo" className="font-display text-lg font-semibold">Seu chamado em andamento</h2>
                <p className="text-sm text-ink/75 mt-1">{ativo.protocol}{ativo.technician_name ? ` · ${ativo.technician_name}` : ""}</p>
              </div>
              <StatusBadge status={ativo.status} />
            </div>
            <p className="text-sm mt-4 line-clamp-2">{ativo.description}</p>
            <ol className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3" aria-label="Linha do tempo do chamado">
              {linhaAtiva.map((status) => {
                const evento = ativo.timeline.find((item) => item.status === status);
                const atual = status === ativo.status;
                return (
                  <li key={status} className={`border-t-2 pt-2 ${evento ? "border-copper" : "border-cream/20"}`}>
                    <p className={`text-xs font-medium ${atual ? "text-amber" : "text-ink/75"}`}>{STATUS_LABELS[status]}</p>
                    {evento && <p className="text-xs text-ink/75 mt-1">{formatDateBR(evento.changed_at)}</p>}
                  </li>
                );
              })}
            </ol>
            <p className="text-sm mt-5"><span className="font-semibold">Próxima ação:</span> {PROXIMA_ACAO[ativo.status] ?? "Acompanhe o chamado para ver as próximas atualizações."}</p>
            <Link href={`/chamados/${ativo.id}`} className="inline-block mt-3 text-sm text-copper-light underline underline-offset-4">Abrir detalhes do chamado</Link>
          </Card>
        </section>
      )}

      {pendentesAvaliacao.length > 0 && (
        <section aria-labelledby="avaliar-pendente-titulo">
          <h2 id="avaliar-pendente-titulo" className="font-display text-sm text-cream/75 mb-3">Avaliações pendentes</h2>
          <div className="space-y-2">
            {pendentesAvaliacao.map((chamado) => (
              <Link key={chamado.id} href={`/chamados/${chamado.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-3 hover:brightness-95 transition">
                  <p className="text-sm">{chamado.protocol} · {chamado.description.slice(0, 90)}</p>
                  <span className="text-sm text-copper-light underline underline-offset-4">Avaliar atendimento</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {abertos.length === 0 && (
          <Card>
            <p className="text-sm text-ink/75">Nenhum chamado em andamento no momento.</p>
          </Card>
        )}
        {abertos.map((r) => (
          <Card key={r.status}>
            <p className="text-xs uppercase text-ink/75 font-display">{STATUS_LABELS[r.status]}</p>
            <p className="text-3xl font-display mt-1">{r.total}</p>
          </Card>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-cream/75">Chamados recentes</h2>
          {recentes.length > 0 && (
            <Link href="/chamados" className="text-xs text-copper-light hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {recentes.length === 0 && (
            <Card>
              <p className="text-sm text-ink/75">Você ainda não abriu nenhum chamado.</p>
            </Card>
          )}
          {recentes.map((c) => (
            <Link key={c.id} href={`/chamados/${c.id}`} className="block">
              <Card className="hover:brightness-95 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <ProtocolBadge protocol={c.protocol} />
                    <p className="mt-2 text-sm line-clamp-2">{c.description}</p>
                    <p className="text-xs text-ink/75 mt-1">
                      {c.technician_name ? `Técnico: ${c.technician_name} · ` : ""}
                      {formatDateBR(c.requested_at)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
