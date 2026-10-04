import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { salvarPerfilTecnico } from "@/app/actions/tecnico";

export default async function PerfilTecnico() {
  const session = await requireRole("technician");
  const userId = session.user.id;

  const [{ rows: perfilRows }, { rows: todas }, { rows: minhas }] = await Promise.all([
    query(
      `select bio, address, latitude, longitude, is_verified from technicians where user_id = $1`,
      [userId]
    ),
    query(`select id, name from specialties order by name`),
    query(`select specialty_id from technician_specialties where technician_id = $1`, [userId]),
  ]);

  const perfil = perfilRows[0] ?? {};
  const selecionadas = new Set(minhas.map((m) => m.specialty_id));

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <p className="font-display text-sm">{session.user.name}</p>
            <p className="text-xs text-ink/50">{session.user.email}</p>
          </div>
          <Badge tone={perfil.is_verified ? "completed" : "en_route"}>
            {perfil.is_verified ? "Verificado" : "Em verificação"}
          </Badge>
        </div>

        <ActionForm action={salvarPerfilTecnico} className="space-y-5">
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-1.5">
              Bio
            </span>
            <textarea
              name="bio"
              rows={4}
              maxLength={500}
              defaultValue={perfil.bio ?? ""}
              placeholder="Conte sua experiência e o tipo de atendimento que você faz."
              className="w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-cream placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper/50"
            />
          </label>

          <Input id="address" name="address" label="Endereço de atuação" defaultValue={perfil.address ?? ""} maxLength={300} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="latitude"
              name="latitude"
              label="Latitude"
              inputMode="decimal"
              placeholder="-23.5505"
              defaultValue={perfil.latitude ?? ""}
            />
            <Input
              id="longitude"
              name="longitude"
              label="Longitude"
              inputMode="decimal"
              placeholder="-46.6333"
              defaultValue={perfil.longitude ?? ""}
            />
          </div>
          <p className="text-xs text-cream/50 -mt-2">
            As coordenadas são usadas para calcular a distância até o cliente. Dica: no Google Maps, clique
            com o botão direito no seu local e copie os números.
          </p>

          <fieldset>
            <legend className="block text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-2">
              Especialidades
            </legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {todas.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="specialties"
                    value={s.id}
                    defaultChecked={selecionadas.has(s.id)}
                    className="accent-[var(--color-copper)]"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>

          <SubmitButton pendingText="Salvando...">Salvar perfil</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
