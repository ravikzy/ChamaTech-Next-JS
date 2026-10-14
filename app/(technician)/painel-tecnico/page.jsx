import Link from "next/link";
import { ShieldAlert, Star } from "lucide-react";
import { requireRole } from "@/lib/session";
import { query, pool } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { alternarDisponibilidade } from "@/app/actions/tecnico";
import { requisitosDisponibilidade } from "@/lib/technicians";
import { formatDateBR } from "@/lib/utils";
import { ActionForm as ServerActionForm, SubmitButton as ReviewSubmitButton } from "@/components/ui/ActionForm";
import { denunciarAvaliacaoAction, responderAvaliacaoAction } from "@/app/actions/reviews";
import { rotulosDasTags } from "@/lib/reviews";

export default async function PainelTecnico() {
  const session = await requireRole("technician");
  const userId = session.user.id;

  const [{ rows: resumoRows }, { rows: solicitacoes }, { rows: perfilRows }, { rows: ativos }, { rows: avaliacoes }, requisitos] = await Promise.all([
    query(
      `select
         count(*) filter (where status = 'pending' and technician_id = $1)::int as direcionados,
         count(*) filter (where status in ('accepted','en_route','in_progress') and technician_id = $1)::int as ativos,
         count(*) filter (where status = 'completed' and completed_at >= date_trunc('month', now()))::int as concluidos_mes
       from services where technician_id = $1`,
      [userId]
    ),
    query(
      `select id, protocol, description, is_emergency, requested_at
         from services
        where status = 'pending' and (technician_id is null or technician_id = $1)
          and exists (select 1 from technicians t where t.user_id = $1 and t.is_verified = true)
        order by is_emergency desc, requested_at asc limit 5`,
      [userId]
    ),
    query(
      `select is_verified, is_available, average_rating, total_reviews from technicians where user_id = $1`,
      [userId]
    ),
    query(
      `select id, protocol, description, status, is_emergency, requested_at
         from services
        where technician_id = $1 and status in ('accepted','en_route','in_progress')
        order by is_emergency desc, requested_at asc
        limit 10`,
      [userId]
    ),
    query(
      `select r.id, r.rating, r.comment, r.tags, r.technician_reply, r.created_at, u.name as client_name
         from reviews r join "user" u on u.id = r.client_id
        where r.technician_id = $1 and r.is_hidden = false
        order by r.created_at desc limit 5`,
      [userId]
    ),
    requisitosDisponibilidade(pool, userId),
  ]);

  const perfil = perfilRows[0];
  const resumo = resumoRows[0];

  // Solicitações abertas que o técnico pode aceitar (só se verificado).
  let abertas = resumo.direcionados;
  if (perfil?.is_verified) {
    const { rows } = await query(
      `select count(*)::int as total from services
        where status = 'pending' and (technician_id is null or technician_id = $1)`,
      [userId]
    );
    abertas = rows[0].total;
  } else {
    abertas = 0;
  }

  const nota = Number(perfil?.average_rating ?? 0);

  return (
    <div className="space-y-4">
      {perfil && !perfil.is_verified && (
        <Card className="bg-amber/15 border border-amber/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-sm">Cadastro em verificação</p>
            <p className="text-sm text-ink/75 mt-1">
              Seu perfil ainda não aparece na busca dos clientes. Um administrador
              precisa verificar seus dados antes de você começar a receber chamados.
            </p>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs uppercase text-ink/75 font-display">Novas solicitações</p>
          <p className="text-3xl font-display mt-1">{abertas}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/75 font-display">Chamados ativos</p>
          <p className="text-3xl font-display mt-1">{resumo.ativos}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/75 font-display">Concluídos neste mês</p>
          <p className="text-3xl font-display mt-1">{resumo.concluidos_mes}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/75 font-display">Nota média</p>
          <p className="text-3xl font-display mt-1 flex items-center gap-2">
            {Number(perfil?.total_reviews) >= 3 ? nota.toFixed(2) : "Novo"}
            {Number(perfil?.total_reviews) >= 3 && <Star className="w-5 h-5 text-amber fill-amber" />}
          </p>
          <p className="text-xs text-ink/75 mt-1">{perfil?.total_reviews ?? 0} avaliações</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm">
              {perfil?.is_available ? "Você está disponível" : "Você está indisponível"}
            </p>
            <p className="text-sm text-ink/75 mt-1">
              {perfil?.is_available
                ? "Seu perfil aparece na busca dos clientes."
                : "Seu perfil não aparece na busca dos clientes."}
            </p>
          </div>
          <ActionForm action={alternarDisponibilidade}>
            <input type="hidden" name="ligar" value={perfil?.is_available ? "0" : "1"} />
            <SubmitButton variant={perfil?.is_available ? "outline" : "primary"} pendingText="Salvando...">
              {perfil?.is_available ? "Ficar indisponível" : "Estou disponível"}
            </SubmitButton>
          </ActionForm>
        </div>
        {requisitos && !requisitos.pronto && !perfil?.is_available && (
          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="text-xs uppercase text-ink/75 font-display mb-2">Para ficar disponível falta</p>
            <ul className="text-sm text-ink/80 list-disc pl-5 space-y-1">
              {requisitos.faltando.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Button as={Link} href="/perfil-tecnico" variant="outline" className="mt-3">
              Completar perfil
            </Button>
          </div>
        )}
      </Card>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-sm text-cream/75">Solicitações pendentes</h2>
          <Button as={Link} href="/solicitacoes" variant="outline">Ver solicitações</Button>
        </div>
        {solicitacoes.length === 0 ? (
          <Card><p className="text-sm text-ink/75">Não há solicitações disponíveis agora.</p></Card>
        ) : (
          <div className="space-y-2">
            {solicitacoes.map((solicitacao) => (
              <Link key={solicitacao.id} href="/solicitacoes" className="block">
                <Card className="hover:brightness-95 transition">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-sm">{solicitacao.protocol}{solicitacao.is_emergency ? " · Emergência" : ""}</p>
                    <span className="text-xs text-ink/75">{formatDateBR(solicitacao.requested_at)}</span>
                  </div>
                  <p className="text-sm text-ink/80 mt-2 line-clamp-2">{solicitacao.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-sm text-cream/75 mb-3">Chamados ativos</h2>
        <div className="space-y-3">
          {ativos.length === 0 && (
            <Card>
              <p className="text-sm text-ink/75">Nenhum chamado ativo no momento.</p>
            </Card>
          )}
          {ativos.map((c) => (
            <Link key={c.id} href={`/meus-chamados/${c.id}`} className="block">
              <Card className="hover:brightness-95 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProtocolBadge protocol={c.protocol} />
                      {c.is_emergency && <Badge tone="disputed">Emergência</Badge>}
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{c.description}</p>
                    <p className="text-xs text-ink/75 mt-1">{formatDateBR(c.requested_at)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm text-cream/75 mb-3">Últimas avaliações</h2>
        {avaliacoes.length === 0 ? (
          <Card><p className="text-sm text-ink/75">Quando receber avaliações, elas aparecerão aqui.</p></Card>
        ) : (
          <div className="space-y-3">
            {avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-sm">{avaliacao.client_name}</p>
                  <p className="text-amber" role="img" aria-label={`${avaliacao.rating} de 5 estrelas`}>{"★".repeat(avaliacao.rating)}</p>
                </div>
                {avaliacao.comment && <p className="text-sm text-ink/80 mt-2">{avaliacao.comment}</p>}
                {avaliacao.tags?.length > 0 && <p className="text-xs text-ink/75 mt-2">{rotulosDasTags(avaliacao.tags).join(" · ")}</p>}
                {avaliacao.technician_reply ? (
                  <p className="border-l-2 border-copper pl-3 mt-3 text-sm">
                    <span className="block text-xs text-ink/75 mb-1">Sua resposta</span>
                    {avaliacao.technician_reply}
                  </p>
                ) : (
                  <ServerActionForm action={responderAvaliacaoAction} className="space-y-2 mt-3">
                    <input type="hidden" name="review_id" value={avaliacao.id} />
                    <label htmlFor={`resposta-${avaliacao.id}`} className="block text-xs font-medium">Responder uma vez (até 500 caracteres)</label>
                    <textarea id={`resposta-${avaliacao.id}`} name="reply" required minLength={2} maxLength={500} rows={2}
                      className="w-full rounded-lg border border-cream/20 bg-workbench px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-focus" />
                    <ReviewSubmitButton variant="outline" pendingText="Publicando...">Publicar resposta</ReviewSubmitButton>
                  </ServerActionForm>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-cream/75 underline underline-offset-4">Denunciar avaliação</summary>
                  <ServerActionForm action={denunciarAvaliacaoAction} className="space-y-2 mt-2">
                    <input type="hidden" name="review_id" value={avaliacao.id} />
                    <label htmlFor={`denuncia-${avaliacao.id}`} className="sr-only">Motivo da denúncia</label>
                    <textarea id={`denuncia-${avaliacao.id}`} name="reason" required minLength={5} maxLength={500} rows={2}
                      placeholder="Explique por que esta avaliação deve ser revisada"
                      className="w-full rounded-lg border border-cream/20 bg-workbench px-3 py-2 text-sm text-cream placeholder:text-cream/75 focus:outline-none focus:ring-2 focus:ring-focus" />
                    <ReviewSubmitButton variant="outline" pendingText="Enviando...">Enviar denúncia</ReviewSubmitButton>
                  </ServerActionForm>
                </details>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
