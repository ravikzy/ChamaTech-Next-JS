import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { abrirChamado } from "@/app/actions/cliente";
import { ActionForm as ServerActionForm, SubmitButton as ReportSubmitButton } from "@/components/ui/ActionForm";
import { denunciarAvaliacaoAction } from "@/app/actions/reviews";
import { rotulosDasTags } from "@/lib/reviews";

export default async function PerfilTecnico({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const emergencia = sp?.emergencia === "1";
  const session = await requireRole("client");
  if (typeof id !== "string" || id.length === 0) notFound();

  const { rows } = await query(
    `select t.user_id, u.name, t.bio, t.average_rating, t.total_reviews, t.is_verified, t.is_available,
            array_agg(distinct s.name) filter (where s.name is not null) as especialidades
       from technicians t
       join "user" u on u.id = t.user_id
       left join technician_specialties ts on ts.technician_id = t.user_id
       left join specialties s on s.id = ts.specialty_id
      where t.user_id = $1 and t.is_verified = true
      group by t.user_id, u.name, t.bio, t.average_rating, t.total_reviews, t.is_verified, t.is_available`,
    [id]
  );
  const tecnico = rows[0];
  if (!tecnico) notFound();

  const [{ rows: avaliacoes }, { rows: clienteRows }] = await Promise.all([
    query(
      `select id, client_id, rating, comment, tags, technician_reply, created_at from reviews
        where technician_id = $1 and is_hidden = false
        order by created_at desc limit 5`,
      [id]
    ),
    query(`select address from clients where user_id = $1`, [session.user.id]),
  ]);
  const enderecoPadrao = clienteRows[0]?.address ?? "";

  return (
    <div>
      <Breadcrumbs
        backHref="/tecnicos"
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Buscar técnico", href: "/tecnicos" },
          { label: tecnico.name },
        ]}
      />
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{tecnico.name}</h1>
            <div className="flex gap-2">
              {tecnico.is_available && <Badge tone="accepted">Disponível agora</Badge>}
              <Badge tone="completed">Verificado</Badge>
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-amber mt-3" aria-label={Number(tecnico.total_reviews) >= 3 ? `Nota média ${Number(tecnico.average_rating).toFixed(1)} de 5` : "Novo no ChamaTech"}>
            {Number(tecnico.total_reviews) >= 3
              ? <>★ {Number(tecnico.average_rating).toFixed(1)} · {tecnico.total_reviews} avaliações</>
              : "Novo no ChamaTech"}
          </p>
          <p className="text-sm text-ink/75 mt-2">{tecnico.bio}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {(tecnico.especialidades || []).map((e) => (
              <span key={e} className="text-xs border border-ink/20 rounded-full px-2.5 py-1">
                {e}
              </span>
            ))}
          </div>

          <h2 className="font-display font-semibold text-sm mt-8 mb-3 text-ink/75">
            Avaliações ({tecnico.total_reviews})
          </h2>
          <div className="space-y-3">
            {avaliacoes.length === 0 && <p className="text-sm text-ink/75">Ainda sem avaliações.</p>}
            {avaliacoes.map((a) => (
              <div key={a.id} className="border-t border-ink/10 pt-3 text-sm">
                <p className="text-amber" role="img" aria-label={`${a.rating} de 5 estrelas`}>{"★".repeat(a.rating)}</p>
                {a.comment && <p className="text-ink/75 mt-1">{a.comment}</p>}
                {a.tags?.length > 0 && <p className="text-xs text-ink/75 mt-2">{rotulosDasTags(a.tags).join(" · ")}</p>}
                {a.technician_reply && (
                  <p className="border-l-2 border-copper pl-3 mt-3">
                    <span className="block text-xs text-ink/75 mb-1">Resposta do técnico</span>
                    {a.technician_reply}
                  </p>
                )}
                {a.client_id !== session.user.id && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-cream/75 underline underline-offset-4">Denunciar avaliação</summary>
                    <ServerActionForm action={denunciarAvaliacaoAction} className="space-y-2 mt-2">
                      <input type="hidden" name="review_id" value={a.id} />
                      <label htmlFor={`denuncia-${a.id}`} className="sr-only">Motivo da denúncia</label>
                      <textarea id={`denuncia-${a.id}`} name="reason" required minLength={5} maxLength={500} rows={2}
                        placeholder="Explique por que esta avaliação deve ser revisada"
                        className="w-full rounded-lg border border-cream/20 bg-workbench px-3 py-2 text-sm text-cream placeholder:text-cream/75 focus:outline-none focus:ring-2 focus:ring-focus" />
                      <ReportSubmitButton variant="outline" pendingText="Enviando...">Enviar denúncia</ReportSubmitButton>
                    </ServerActionForm>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="h-fit">
          <h2 className="font-display font-semibold text-sm mb-3">Abrir chamado</h2>
          {tecnico.is_available ? (
            <ActionForm action={abrirChamado} className="space-y-3">
              <input type="hidden" name="technician_id" value={tecnico.user_id} />
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={1000}
                placeholder="Descreva o problema (mínimo de 10 caracteres)..."
                rows={4}
                className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/75 focus:outline-none focus:ring-2 focus:ring-copper"
              />
              <Input
                id="address"
                name="address"
                label="Endereço do atendimento"
                defaultValue={enderecoPadrao}
                maxLength={300}
                placeholder="Rua, número, bairro"
              />
              <p className="text-xs text-cream/75">O endereço será compartilhado com o técnico quando ele aceitar.</p>
              <Link href="/ajuda#abrir-chamado" className="block text-sm text-copper-light underline underline-offset-4">Como funciona a solicitação?</Link>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_emergency" defaultChecked={emergencia} className="accent-[var(--color-copper)]" />
                Emergência
              </label>
              <SubmitButton className="w-full" pendingText="Enviando...">
                Solicitar
              </SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-sm text-ink/75">
              Este técnico não está disponível agora. Volte à busca para ver quem está disponível.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
