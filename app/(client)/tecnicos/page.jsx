import Link from "next/link";
import { Zap } from "lucide-react";
import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { buscarTecnicos } from "@/lib/technicians";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/PageStates";
import { cn } from "@/lib/utils";

export default async function BuscaTecnicos({ searchParams }) {
  const params = await searchParams;
  const emergencia = params?.emergencia === "1";
  const especialidade = typeof params?.especialidade === "string" ? params.especialidade : undefined;
  const ordenar = params?.ordenar === "nota" ? "nota" : "proximidade";

  const session = await requireRole("client");
  const [{ rows: clienteRows }, { rows: especialidades }] = await Promise.all([
    query(`select latitude, longitude from clients where user_id = $1`, [session.user.id]),
    query(`select name, slug from specialties order by name`),
  ]);
  const local = clienteRows[0];

  const tecnicos = await buscarTecnicos({
    lat: local?.latitude ?? undefined,
    lng: local?.longitude ?? undefined,
    especialidade,
    ordenar,
  });

  // Mantém o modo emergência ao trocar de filtro.
  function hrefFiltro(slug) {
    const q = new URLSearchParams();
    if (emergencia) q.set("emergencia", "1");
    if (slug) q.set("especialidade", slug);
    if (ordenar !== "proximidade") q.set("ordenar", ordenar);
    const texto = q.toString();
    return texto ? `/tecnicos?${texto}` : "/tecnicos";
  }
  function hrefOrdenar(value) {
    const q = new URLSearchParams();
    if (emergencia) q.set("emergencia", "1");
    if (especialidade) q.set("especialidade", especialidade);
    if (value !== "proximidade") q.set("ordenar", value);
    return q.size ? `/tecnicos?${q.toString()}` : "/tecnicos";
  }
  const sufixoPerfil = emergencia ? "?emergencia=1" : "";

  return (
    <div className="space-y-4">
      {emergencia && (
        <Card className="bg-amber/15 border border-amber/30 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-sm">Modo emergência</p>
            <p className="text-sm text-ink/75 mt-1">
              Mostrando primeiro os técnicos disponíveis agora e mais próximos de você. O chamado
              já vai marcado como emergência.
            </p>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Filtrar por especialidade">
        <Link
          href={hrefFiltro()}
          className={cn(
            "text-xs rounded-full border px-3 py-1.5 transition-colors",
            !especialidade
              ? "bg-copper text-white border-copper"
              : "border-cream/20 text-cream/80 hover:bg-workbench-soft"
          )}
        >
          Todas
        </Link>
        {especialidades.map((e) => (
          <Link
            key={e.slug}
            href={hrefFiltro(e.slug)}
            className={cn(
              "text-xs rounded-full border px-3 py-1.5 transition-colors",
              especialidade === e.slug
                ? "bg-copper text-white border-copper"
                : "border-cream/20 text-cream/80 hover:bg-workbench-soft"
            )}
          >
            {e.name}
          </Link>
        ))}
      </div>

      <nav aria-label="Ordenar técnicos" className="flex flex-wrap items-center gap-2 text-sm">
        <span>Ordenar por:</span>
        <Link href={hrefOrdenar("proximidade")} aria-current={ordenar === "proximidade" ? "page" : undefined}
          className={ordenar === "proximidade" ? "rounded-full bg-copper px-3 py-1.5 text-white" : "rounded-full border border-cream/20 px-3 py-1.5 text-cream/80 hover:bg-workbench-soft"}>
          Proximidade
        </Link>
        <Link href={hrefOrdenar("nota")} aria-current={ordenar === "nota" ? "page" : undefined}
          className={ordenar === "nota" ? "rounded-full bg-copper px-3 py-1.5 text-white" : "rounded-full border border-cream/20 px-3 py-1.5 text-cream/80 hover:bg-workbench-soft"}>
          Nota
        </Link>
      </nav>

      {tecnicos.length === 0 && (
        <EmptyState
          title="Nenhum técnico disponível agora"
          description={especialidade
            ? "Não encontramos profissionais nesta especialidade. Remova o filtro ou tente novamente mais tarde."
            : "Não encontramos profissionais disponíveis perto de você. Tente novamente mais tarde."}
          href={especialidade ? hrefFiltro() : "/cadastro?perfil=tecnico"}
          actionLabel={especialidade ? "Ver todas as especialidades" : "Cadastrar como técnico"}
        />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tecnicos.map((t, i) => (
          <Link key={t.user_id} href={`/tecnicos/${t.user_id}${sufixoPerfil}`}>
            <Card
              className={cn(
                "h-full hover:brightness-95 transition",
                emergencia && i === 0 && "border-amber/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display">{t.name}</h3>
                <Badge tone="completed">
                  {Number(t.total_reviews) >= 3
                    ? `★ ${Number(t.average_rating).toFixed(1)} · ${t.total_reviews} avaliações`
                    : "Novo"}
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-circuit mt-2">
                <span className="status-pulse" /> Disponível agora
              </p>
              <p className="text-sm text-ink/75 mt-2 line-clamp-2">{t.bio}</p>
              {t.especialidades?.length > 0 && (
                <p className="text-xs text-ink/75 mt-2 line-clamp-1">{t.especialidades.join(" · ")}</p>
              )}
              <p className="text-xs text-ink/75 mt-3">
                {t.distancia_km != null ? `${Number(t.distancia_km).toFixed(1)} km de distância` : ""}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
