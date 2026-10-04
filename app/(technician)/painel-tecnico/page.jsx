import Link from "next/link";
import { ShieldAlert, Star } from "lucide-react";
import { requireRole } from "@/lib/session";
import { query, pool } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { alternarDisponibilidade } from "@/app/actions/tecnico";
import { requisitosDisponibilidade } from "@/lib/technicians";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

export default async function PainelTecnico() {
  const session = await requireRole("technician");
  const userId = session.user.id;

  const [{ rows: resumoRows }, { rows: perfilRows }, { rows: ativos }, requisitos] = await Promise.all([
    query(
      `select
         count(*) filter (where status = 'pending' and technician_id = $1)::int as direcionados,
         count(*) filter (where status in ('accepted','en_route','in_progress') and technician_id = $1)::int as ativos
       from services where technician_id = $1`,
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
            <p className="text-sm text-ink/70 mt-1">
              Seu perfil ainda não aparece na busca dos clientes. Um administrador
              precisa verificar seus dados antes de você começar a receber chamados.
            </p>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase text-ink/50 font-display">Novas solicitações</p>
          <p className="text-3xl font-display mt-1">{abertas}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/50 font-display">Chamados ativos</p>
          <p className="text-3xl font-display mt-1">{resumo.ativos}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/50 font-display">Nota média</p>
          <p className="text-3xl font-display mt-1 flex items-center gap-2">
            {perfil?.total_reviews > 0 ? nota.toFixed(2) : "—"}
            {perfil?.total_reviews > 0 && <Star className="w-5 h-5 text-amber fill-amber" />}
          </p>
          <p className="text-xs text-ink/50 mt-1">{perfil?.total_reviews ?? 0} avaliações</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm">
              {perfil?.is_available ? "Você está disponível" : "Você está indisponível"}
            </p>
            <p className="text-sm text-ink/70 mt-1">
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
            <p className="text-xs uppercase text-ink/50 font-display mb-2">Para ficar disponível falta</p>
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
        <h2 className="font-display text-sm text-cream/60 mb-3">Chamados ativos</h2>
        <div className="space-y-3">
          {ativos.length === 0 && (
            <Card>
              <p className="text-sm text-ink/70">Nenhum chamado ativo no momento.</p>
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
                    <p className="text-xs text-ink/50 mt-1">{formatDateBR(c.requested_at)}</p>
                  </div>
                  <Badge tone={c.status}>{STATUS_LABELS[c.status]}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
