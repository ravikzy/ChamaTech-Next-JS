import { notFound } from "next/navigation";
import { requireRole, isUuid } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { cancelarChamado, abrirDisputa, avaliarChamado } from "@/app/actions/cliente";
import { STATUS_LABELS, formatDateBR, formatBRL } from "@/lib/utils";

const PODE_CANCELAR = ["pending", "accepted", "en_route"];

const STATUS_DISPUTA = {
  open: "Aberta",
  reviewing: "Em análise",
  resolved: "Resolvida",
  dismissed: "Arquivada",
};

export default async function DetalheChamado({ params }) {
  const { id } = await params;
  const session = await requireRole("client");
  if (!isUuid(id)) notFound();

  // Só o cliente dono do chamado enxerga: qualquer outro caso vira "não encontrado".
  const { rows } = await query(
    `select sv.*, u.name as technician_name
       from services sv
       left join "user" u on u.id = sv.technician_id
      where sv.id = $1 and sv.client_id = $2`,
    [id, session.user.id]
  );
  const chamado = rows[0];
  if (!chamado) notFound();

  const [{ rows: historico }, { rows: avaliacao }, { rows: disputas }] = await Promise.all([
    query(
      `select status, changed_at from service_status_history
        where service_id = $1 order by changed_at asc`,
      [id]
    ),
    query(`select rating, comment from reviews where service_id = $1`, [id]),
    query(
      `select reason, status, resolution_notes, created_at from disputes
        where service_id = $1 order by created_at desc`,
      [id]
    ),
  ]);

  const jaAvaliou = avaliacao.length > 0;

  return (
    <div>
      <Breadcrumbs
        backHref="/chamados"
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Meus chamados", href: "/chamados" },
          { label: chamado.protocol },
        ]}
      />
      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <ProtocolBadge protocol={chamado.protocol} />
                {chamado.is_emergency && <Badge tone="disputed">Emergência</Badge>}
              </div>
              <Badge tone={chamado.status}>{STATUS_LABELS[chamado.status]}</Badge>
            </div>
            <p className="mt-4 text-sm whitespace-pre-line">{chamado.description}</p>
            {chamado.address && <p className="text-xs text-ink/50 mt-3">Endereço: {chamado.address}</p>}
            {chamado.technician_name ? (
              <p className="text-xs text-ink/50 mt-1">Técnico: {chamado.technician_name}</p>
            ) : (
              <p className="text-xs text-ink/50 mt-1">Aguardando um técnico aceitar.</p>
            )}

            <h2 className="font-display font-semibold text-sm mt-8 mb-3 text-ink/60">Histórico</h2>
            <ol className="space-y-2 text-sm">
              {historico.map((h, i) => (
                <li key={i} className="flex justify-between gap-4 border-t border-ink/10 pt-2">
                  <span>{STATUS_LABELS[h.status]}</span>
                  <span className="text-ink/50">{formatDateBR(h.changed_at)}</span>
                </li>
              ))}
            </ol>
          </Card>

          {disputas.length > 0 && (
            <Card>
              <h2 className="font-display font-semibold text-sm mb-3">Disputa</h2>
              <div className="space-y-4">
                {disputas.map((d, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="disputed">{STATUS_DISPUTA[d.status] ?? d.status}</Badge>
                      <span className="text-xs text-ink/50">{formatDateBR(d.created_at)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line">{d.reason}</p>
                    {d.resolution_notes && (
                      <p className="mt-2 text-ink/70">
                        <span className="font-medium">Resposta da equipe:</span> {d.resolution_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {chamado.status === "completed" && jaAvaliou && (
            <Card>
              <h2 className="font-display font-semibold text-sm mb-2">Sua avaliação</h2>
              <p className="text-amber">{"★".repeat(avaliacao[0].rating)}</p>
              {avaliacao[0].comment && <p className="text-sm text-ink/70 mt-1">{avaliacao[0].comment}</p>}
            </Card>
          )}

          {chamado.status === "completed" && !jaAvaliou && (
            <Card>
              <h2 className="font-display font-semibold text-sm mb-3">Avaliar atendimento</h2>
              <ActionForm action={avaliarChamado} className="space-y-3">
                <input type="hidden" name="service_id" value={chamado.id} />
                <fieldset>
                  <legend className="text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-2">
                    Nota
                  </legend>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label
                        key={n}
                        className="flex items-center gap-1.5 rounded-lg border border-cream/15 bg-workbench px-3 py-2 text-sm text-cream cursor-pointer has-[:checked]:border-amber has-[:checked]:text-amber"
                      >
                        <input type="radio" name="rating" value={n} required className="sr-only" />
                        {n} ★
                      </label>
                    ))}
                  </div>
                </fieldset>
                <textarea
                  name="comment"
                  rows={3}
                  maxLength={500}
                  placeholder="Conte como foi o atendimento (opcional)"
                  className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper"
                />
                <SubmitButton pendingText="Enviando...">Enviar avaliação</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>

        <div className="space-y-4 h-fit">
          <Card>
            <h2 className="font-display font-semibold text-sm mb-3">Valor</h2>
            <p className="text-2xl font-display font-bold">
              {chamado.price != null ? formatBRL(chamado.price) : "A combinar"}
            </p>
            <p className="text-xs text-ink/50 mt-1">Aberto em {formatDateBR(chamado.requested_at)}</p>
          </Card>

          {PODE_CANCELAR.includes(chamado.status) && (
            <Card>
              <h2 className="font-display font-semibold text-sm mb-3">Cancelar chamado</h2>
              <ActionForm action={cancelarChamado}>
                <input type="hidden" name="service_id" value={chamado.id} />
                <SubmitButton variant="danger" pendingText="Cancelando...">
                  Cancelar chamado
                </SubmitButton>
              </ActionForm>
            </Card>
          )}

          {chamado.status === "in_progress" && (
            <Card>
              <h2 className="font-display font-semibold text-sm mb-3">Algo deu errado?</h2>
              <ActionForm action={abrirDisputa} className="space-y-3">
                <input type="hidden" name="service_id" value={chamado.id} />
                <textarea
                  name="reason"
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                  placeholder="Explique o motivo da disputa"
                  className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper"
                />
                <SubmitButton variant="outline" pendingText="Enviando...">
                  Abrir disputa
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
