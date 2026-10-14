import { notFound } from "next/navigation";
import { requireRole, isUuid } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TecnicoAcoes } from "@/components/service/TecnicoAcoes";
import { STATUS_LABELS, formatDateBR, whatsappHref } from "@/lib/utils";
import { ChatPanel } from "@/components/service/ChatPanel";

export default async function DetalheChamadoTecnico({ params }) {
  const { id } = await params;
  const session = await requireRole("technician");
  if (!isUuid(id)) notFound();

  // Só o técnico do chamado enxerga.
  const { rows } = await query(
    `select sv.*, u.name as client_name, u.phone as client_phone, sp.name as specialty_name
       from services sv
       join "user" u on u.id = sv.client_id
       left join specialties sp on sp.id = sv.specialty_id
      where sv.id = $1 and sv.technician_id = $2`,
    [id, session.user.id]
  );
  const chamado = rows[0];
  if (!chamado) notFound();
  const whatsapp = chamado.accepted_at ? whatsappHref(chamado.client_phone) : null;

  const { rows: historico } = await query(
    `select status, changed_at from service_status_history
      where service_id = $1 order by changed_at asc`,
    [id]
  );

  return (
    <div>
      <Breadcrumbs
        backHref="/meus-chamados"
        items={[
          { label: "Painel", href: "/painel-tecnico" },
          { label: "Meus chamados", href: "/meus-chamados" },
          { label: chamado.protocol },
        ]}
      />
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <ProtocolBadge protocol={chamado.protocol} />
              {chamado.is_emergency && <Badge tone="disputed">Emergência</Badge>}
            </div>
            <StatusBadge status={chamado.status} />
          </div>

          <h2 className="font-display font-semibold text-sm mt-6 mb-2 text-ink/75">Descrição do problema</h2>
          <p className="text-sm whitespace-pre-line">{chamado.description}</p>

          <h2 className="font-display font-semibold text-sm mt-6 mb-2 text-ink/75">Histórico</h2>
          <ol className="space-y-2 text-sm">
            {historico.map((h, i) => (
              <li key={i} className="flex justify-between gap-4 border-t border-ink/10 pt-2">
                <span>{STATUS_LABELS[h.status]}</span>
                <span className="text-ink/75">{formatDateBR(h.changed_at)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4 h-fit">
          <Card>
            <h2 className="font-display font-semibold text-sm mb-3">Cliente</h2>
            <p className="text-sm">{chamado.client_name}</p>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex mt-3 rounded-control bg-circuit px-4 py-2 text-sm font-semibold text-workbench focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                Conversar pelo WhatsApp
              </a>
            )}
            <h2 className="font-display font-semibold text-sm mt-5 mb-2">Endereço</h2>
            <p className="text-sm text-ink/80">{chamado.address || "Não informado"}</p>
            {chamado.specialty_name && (
              <>
                <h2 className="font-display font-semibold text-sm mt-5 mb-2">Especialidade</h2>
                <p className="text-sm text-ink/80">{chamado.specialty_name}</p>
              </>
            )}
            <p className="text-xs text-ink/75 mt-5">Aberto em {formatDateBR(chamado.requested_at)}</p>
          </Card>

          <Card>
            <h2 className="font-display font-semibold text-sm mb-3">Próximo passo</h2>
            {["pending", "accepted", "en_route", "in_progress"].includes(chamado.status) ? (
              <TecnicoAcoes serviceId={chamado.id} status={chamado.status} emergencia={chamado.is_emergency} />
            ) : (
              <p className="text-sm text-ink/75">Nenhuma ação pendente neste chamado.</p>
            )}
          </Card>
        </div>
      </div>
      {chamado.accepted_at && <div className="mt-6"><ChatPanel serviceId={chamado.id} userId={session.user.id} /></div>}
    </div>
  );
}
