import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/PageStates";
import { formatDateBR, STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default async function ChamadosCliente({ searchParams }) {
  const session = await requireRole("client");
  const params = await searchParams;
  const status = typeof params?.status === "string" && Object.hasOwn(STATUS_LABELS, params.status) ? params.status : "";

  const { rows } = await query(
    `select sv.id, sv.protocol, sv.description, sv.status, sv.requested_at,
            u.name as technician_name
     from services sv
     left join "user" u on u.id = sv.technician_id
     where sv.client_id = $1 and ($2 = '' or sv.status::text = $2)
     order by sv.requested_at desc`,
    [session.user.id, status]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label htmlFor="filtro-status" className="text-sm">Filtrar por status</label>
          <select id="filtro-status" name="status" defaultValue={status} className="rounded-control border border-cream/20 bg-workbench px-3 py-2 text-sm text-cream focus-visible:ring-2 focus-visible:ring-focus">
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Button type="submit" variant="outline">Filtrar</Button>
        </form>
        <Button as={Link} href="/tecnicos">Novo chamado</Button>
      </div>
      {rows.length === 0 && !status && (
        <EmptyState
          title="Você ainda não abriu nenhum chamado"
          description="Encontre um técnico disponível e acompanhe o atendimento por aqui."
          href="/tecnicos"
          actionLabel="Buscar técnico"
        />
      )}
      {rows.length === 0 && status && <p className="text-sm text-ink/75">Nenhum chamado com o status “{STATUS_LABELS[status]}”.</p>}
      {rows.map((c) => (
        <Link key={c.id} href={`/chamados/${c.id}`}>
          <Card className="hover:brightness-95 transition">
            <div className="flex items-center justify-between gap-4">
              <div>
                <ProtocolBadge protocol={c.protocol} />
                <p className="mt-2 text-sm">{c.description}</p>
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
  );
}
