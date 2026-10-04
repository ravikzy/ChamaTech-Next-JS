import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TecnicoAcoes } from "@/components/service/TecnicoAcoes";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

export default async function MeusChamados() {
  const session = await requireRole("technician");

  const { rows } = await query(
    `select sv.id, sv.protocol, sv.description, sv.status, sv.is_emergency, sv.requested_at,
            u.name as client_name
       from services sv
       join "user" u on u.id = sv.client_id
      where sv.technician_id = $1
      order by
        case when sv.status in ('pending','accepted','en_route','in_progress') then 0 else 1 end,
        sv.is_emergency desc,
        sv.requested_at desc
      limit 100`,
    [session.user.id]
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <Card>
          <p className="text-sm text-ink/70">
            Você ainda não tem chamados. Veja as novas em <Link href="/solicitacoes" className="underline">Solicitações</Link>.
          </p>
        </Card>
      )}
      {rows.map((c) => (
        <Card key={c.id}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link href={`/meus-chamados/${c.id}`} className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ProtocolBadge protocol={c.protocol} />
                {c.is_emergency && <Badge tone="disputed">Emergência</Badge>}
                <Badge tone={c.status}>{STATUS_LABELS[c.status]}</Badge>
              </div>
              <p className="mt-2 text-sm line-clamp-2">{c.description}</p>
              <p className="text-xs text-ink/50 mt-1">
                Cliente: {c.client_name} · {formatDateBR(c.requested_at)}
              </p>
            </Link>
            <TecnicoAcoes serviceId={c.id} status={c.status} emergencia={c.is_emergency} />
          </div>
        </Card>
      ))}
    </div>
  );
}
