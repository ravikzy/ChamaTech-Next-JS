import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { verificarTecnico, recusarTecnico } from "@/app/actions/admin";
import { formatDateBR } from "@/lib/utils";

export default async function TecnicosPendentes() {
  await requireRole("admin");
  const { rows } = await query(
    `select t.user_id, u.name, u.email, u.phone, t.bio, t.address, t.created_at,
            array_remove(array_agg(distinct s.name), null) as especialidades
       from technicians t
       join "user" u on u.id = t.user_id
       left join technician_specialties ts on ts.technician_id = t.user_id
       left join specialties s on s.id = ts.specialty_id
      where t.is_verified = false
      group by t.user_id, u.name, u.email, u.phone, t.bio, t.address, t.created_at
      order by t.created_at asc`
  );

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <Card>
          <p className="text-sm text-ink/75">Nenhum técnico aguardando verificação.</p>
        </Card>
      )}
      {rows.map((t) => (
        <Card key={t.user_id}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display">{t.name}</h2>
                <Badge tone="en_route">Pendente</Badge>
              </div>
              <p className="text-xs text-ink/75 mt-1">
                {t.email}
                {t.phone ? ` · ${t.phone}` : ""}
              </p>
              <p className="text-sm text-ink/80 mt-3">
                {t.bio || <span className="text-ink/75">Sem bio preenchida.</span>}
              </p>
              {t.address && <p className="text-xs text-ink/75 mt-1">{t.address}</p>}
              <p className="text-xs text-ink/75 mt-2">
                {t.especialidades.length > 0 ? t.especialidades.join(" · ") : "Nenhuma especialidade escolhida"}
              </p>
              <p className="text-xs text-ink/75 mt-1">Cadastro em {formatDateBR(t.created_at)}</p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <ActionForm action={verificarTecnico}>
                <input type="hidden" name="technician_id" value={t.user_id} />
                <SubmitButton pendingText="Verificando...">Verificar</SubmitButton>
              </ActionForm>
              <ActionForm action={recusarTecnico}>
                <input type="hidden" name="technician_id" value={t.user_id} />
                <SubmitButton variant="outline" pendingText="Recusando...">
                  Recusar
                </SubmitButton>
              </ActionForm>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
