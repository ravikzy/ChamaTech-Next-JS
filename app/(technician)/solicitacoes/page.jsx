import { ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/PageStates";
import { TecnicoAcoes } from "@/components/service/TecnicoAcoes";
import { formatDateBR } from "@/lib/utils";

export default async function Solicitacoes() {
  const session = await requireRole("technician");
  const userId = session.user.id;

  const { rows: perfil } = await query(
    `select is_verified from technicians where user_id = $1`,
    [userId]
  );

  // Técnico não verificado não vê (nem aceita) solicitações.
  if (!perfil[0]?.is_verified) {
    return (
      <Card className="bg-amber/15 border border-amber/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-sm">Cadastro em verificação</p>
          <p className="text-sm text-ink/75 mt-1">
            As solicitações só ficam visíveis depois que um administrador verificar o seu cadastro.
          </p>
        </div>
      </Card>
    );
  }

  // Abertas para todos (sem técnico) ou direcionadas a este técnico.
  const { rows } = await query(
    `select id, protocol, description, is_emergency, requested_at, technician_id
       from services
      where status = 'pending' and (technician_id is null or technician_id = $1)
      order by is_emergency desc, requested_at asc
      limit 20`,
    [userId]
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <EmptyState
          title="Nenhuma solicitação aberta"
          description="Confira se sua disponibilidade está ativa. Novos chamados aparecerão aqui."
          href="/perfil-tecnico"
          actionLabel="Ver meu perfil"
        />
      )}
      {rows.map((s) => (
        <Card key={s.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ProtocolBadge protocol={s.protocol} />
                {s.is_emergency && <Badge tone="disputed">Emergência</Badge>}
                {s.technician_id === userId && <Badge tone="accepted">Direcionado a você</Badge>}
              </div>
              <p className="mt-2 text-sm">{s.description}</p>
              <p className="text-xs text-ink/75 mt-1">
                {formatDateBR(s.requested_at)} · Endereço liberado após aceitar o chamado.
              </p>
            </div>
            <TecnicoAcoes serviceId={s.id} status="pending" emergencia={s.is_emergency} />
          </div>
        </Card>
      ))}
    </div>
  );
}
