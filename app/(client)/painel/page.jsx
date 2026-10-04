import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS, formatDateBR } from "@/lib/utils";

export default async function ClientPainel() {
  const session = await requireRole("client");
  const userId = session.user.id;

  const [{ rows: resumo }, { rows: recentes }] = await Promise.all([
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
  ]);

  const abertos = resumo.filter((r) => !["completed", "cancelled"].includes(r.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button as={Link} href="/tecnicos">
          Buscar técnico
        </Button>
        <Button as={Link} href="/tecnicos?emergencia=1" variant="amber" className="text-ink">
          Emergência
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {abertos.length === 0 && (
          <Card>
            <p className="text-sm text-ink/70">Nenhum chamado em andamento no momento.</p>
          </Card>
        )}
        {abertos.map((r) => (
          <Card key={r.status}>
            <p className="text-xs uppercase text-ink/50 font-display">{STATUS_LABELS[r.status]}</p>
            <p className="text-3xl font-display mt-1">{r.total}</p>
          </Card>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-cream/60">Chamados recentes</h2>
          {recentes.length > 0 && (
            <Link href="/chamados" className="text-xs text-copper-light hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {recentes.length === 0 && (
            <Card>
              <p className="text-sm text-ink/70">Você ainda não abriu nenhum chamado.</p>
            </Card>
          )}
          {recentes.map((c) => (
            <Link key={c.id} href={`/chamados/${c.id}`} className="block">
              <Card className="hover:brightness-95 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <ProtocolBadge protocol={c.protocol} />
                    <p className="mt-2 text-sm line-clamp-2">{c.description}</p>
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
      </section>
    </div>
  );
}
