import Link from "next/link";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

export default async function ChamadosCliente() {
  const session = await requireRole("client");

  const { rows } = await query(
    `select sv.id, sv.protocol, sv.description, sv.status, sv.requested_at,
            u.name as technician_name
     from services sv
     left join "user" u on u.id = sv.technician_id
     where sv.client_id = $1
     order by sv.requested_at desc`,
    [session.user.id]
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <Card>
          <p className="text-sm text-ink/70">Você ainda não abriu nenhum chamado.</p>
        </Card>
      )}
      {rows.map((c) => (
        <Link key={c.id} href={`/chamados/${c.id}`}>
          <Card className="hover:brightness-95 transition">
            <div className="flex items-center justify-between gap-4">
              <div>
                <ProtocolBadge protocol={c.protocol} />
                <p className="mt-2 text-sm">{c.description}</p>
                <p className="text-xs text-ink/50 mt-1">
                  {c.technician_name ? `Técnico: ${c.technician_name} · ` : ""}
                  {formatDateBR(c.requested_at)}
                </p>
              </div>
              <Badge tone={c.status}>{STATUS_LABELS[c.status]}</Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
