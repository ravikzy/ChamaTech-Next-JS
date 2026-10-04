import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { abrirChamado } from "@/app/actions/cliente";

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
      `select rating, comment, created_at from reviews where technician_id = $1
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
          <p className="text-sm text-ink/70 mt-2">{tecnico.bio}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {(tecnico.especialidades || []).map((e) => (
              <span key={e} className="text-xs border border-ink/20 rounded-full px-2.5 py-1">
                {e}
              </span>
            ))}
          </div>

          <h2 className="font-display font-semibold text-sm mt-8 mb-3 text-ink/60">
            Avaliações ({tecnico.total_reviews})
          </h2>
          <div className="space-y-3">
            {avaliacoes.length === 0 && <p className="text-sm text-ink/50">Ainda sem avaliações.</p>}
            {avaliacoes.map((a, i) => (
              <div key={i} className="border-t border-ink/10 pt-3 text-sm">
                <p className="text-amber">{"★".repeat(a.rating)}</p>
                {a.comment && <p className="text-ink/70">{a.comment}</p>}
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
                className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper"
              />
              <Input
                id="address"
                name="address"
                label="Endereço do atendimento"
                defaultValue={enderecoPadrao}
                maxLength={300}
                placeholder="Rua, número, bairro"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_emergency" defaultChecked={emergencia} className="accent-[var(--color-copper)]" />
                Emergência
              </label>
              <SubmitButton className="w-full" pendingText="Enviando...">
                Solicitar
              </SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-sm text-ink/60">
              Este técnico não está disponível agora. Volte à busca para ver quem está disponível.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
