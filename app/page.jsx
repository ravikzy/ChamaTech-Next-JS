import Link from "next/link";
import {
  MapPin, ShieldCheck, Star, Wrench, MonitorCog,
  Wifi, Printer, Smartphone, Tv, ShieldAlert,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FramedPhoto } from "@/components/ui/FramedPhoto";
import { EmptyState } from "@/components/ui/PageStates";
import { query } from "@/lib/db";

const ESPECIALIDADES = [
  { name: "Hardware de computador", Icon: MonitorCog },
  { name: "Redes e Wi-Fi", Icon: Wifi },
  { name: "Remoção de vírus", Icon: ShieldAlert },
  { name: "Impressoras", Icon: Printer },
  { name: "Celulares e tablets", Icon: Smartphone },
  { name: "TVs e smart home", Icon: Tv },
];

const PASSOS = [
  { n: "01", titulo: "Conte o que aconteceu", texto: "Descreva o problema e escolha uma especialidade ou um técnico disponível." },
  { n: "02", titulo: "Acompanhe o chamado", texto: "Veja quando o técnico aceitar, sair para o atendimento e começar o serviço." },
  { n: "03", titulo: "Finalize e avalie", texto: "Depois da conclusão, registre sua nota e conte como foi o atendimento." },
];

async function getDados() {
  try {
    const [{ rows: avaliacoes }, { rows: stats }, { rows: tecnicos }, { rows: especialidades }] = await Promise.all([
      query(
        `select r.rating, r.comment, ut.name as tecnico
         from reviews r
         join "user" ut on ut.id = r.technician_id
         where nullif(trim(r.comment), '') is not null
         order by r.created_at desc limit 3`
      ),
      query(
        `select
           (select count(*) from technicians where is_available = true and is_verified = true)::int as disponiveis`
      ),
      query(
        `select t.user_id, u.name, t.bio, t.average_rating, t.total_reviews,
                array_remove(array_agg(distinct s.name), null) as especialidades
           from technicians t
           join "user" u on u.id = t.user_id
           left join technician_specialties ts on ts.technician_id = t.user_id
           left join specialties s on s.id = ts.specialty_id
          where t.is_available = true and t.is_verified = true
          group by t.user_id, u.name, t.bio, t.average_rating, t.total_reviews
          order by t.total_reviews desc, t.average_rating desc, u.name asc
          limit 3`
      ),
      query(`select name from specialties order by name`),
    ]);
    return { avaliacoes, stats: stats[0], tecnicos, especialidades: especialidades.map((item) => item.name) };
  } catch {
    return { avaliacoes: [], tecnicos: [], especialidades: [], stats: { disponiveis: 0 } };
  }
}

export default async function LandingPage() {
  const { avaliacoes, stats, tecnicos, especialidades: especialidadesDB } = await getDados();
  const especialidades = especialidadesDB.length ? especialidadesDB : ESPECIALIDADES.map((item) => item.name);

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm text-ink/80 border border-cream/15 rounded-full px-3 py-1.5">
              {stats.disponiveis > 0 && <span className="status-pulse" aria-hidden="true" />}
              {stats.disponiveis > 0
                ? `${stats.disponiveis} ${stats.disponiveis === 1 ? "técnico disponível" : "técnicos disponíveis"}`
                : "Assistência técnica organizada por chamado"}
            </span>

            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mt-5 font-extrabold max-w-2xl">
              Encontre ajuda técnica para seus equipamentos.
            </h1>

            <p className="mt-5 text-cream/75 max-w-md text-lg">
              Descreva o problema, encontre profissionais verificados e acompanhe cada etapa do atendimento.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} href="/cadastro" variant="primary">
                Encontrar um técnico
              </Button>
              <Button as={Link} href="/cadastro?perfil=tecnico" variant="outline">
                Sou técnico
              </Button>
            </div>

          </div>

          <FramedPhoto
            src="/images/tecnico-bancada.jpg"
            alt="Técnico especializado consertando um aparelho eletrônico"
            priority
            className="w-full max-w-[32rem] mx-auto lg:mx-0 mt-8 lg:mt-0"
            floatingCard={stats.disponiveis > 0 ? (
              <div className="flex items-center gap-2.5">
                <span className="status-pulse" />
                <div>
                  <p className="text-sm font-semibold">{stats.disponiveis} disponíveis</p>
                  <p className="text-xs text-cream/75">Perfis verificados</p>
                </div>
              </div>
            ) : null}
          />
        </div>
      </section>

      {/* SELOS DE CONFIANÇA */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-7 border-y border-cream/10 py-7">
        <div>
          <MapPin className="w-5 h-5 text-copper-light" aria-hidden="true" />
          <h3 className="font-display font-semibold mt-3">Busca por proximidade</h3>
          <p className="text-sm text-cream/75 mt-1">A busca mostra uma distância aproximada, sem revelar coordenadas exatas.</p>
        </div>
        <div>
          <ShieldCheck className="w-5 h-5 text-copper-light" aria-hidden="true" />
          <h3 className="font-display font-semibold mt-3">Perfil revisado</h3>
          <p className="text-sm text-cream/75 mt-1">A equipe revisa o cadastro antes de liberar o técnico para receber chamados.</p>
        </div>
        <div>
          <Star className="w-5 h-5 text-copper-light" aria-hidden="true" />
          <h3 className="font-display font-semibold mt-3">Avaliações vinculadas</h3>
          <p className="text-sm text-cream/75 mt-1">Só o cliente de um chamado concluído pode avaliar aquele atendimento.</p>
        </div>
      </section>

      {/* COMO FUNCIONA — sequência real, números fazem sentido aqui */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold mb-8">Como funciona</h2>
            <ol className="space-y-6">
              {PASSOS.map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="font-display text-2xl font-bold text-copper-light" aria-hidden="true">{p.n}</span>
                  <div>
                    <p className="font-display font-semibold">{p.titulo}</p>
                    <p className="text-sm text-cream/75 mt-1">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <FramedPhoto
            src="/images/notebook-multimetro.jpg"
            alt="Técnico testando uma placa com multímetro"
            className="w-full max-w-sm mx-auto lg:ml-auto"
          />
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl font-bold mb-8">Especialidades atendidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
          {especialidades.map((name) => {
            const Icon = ESPECIALIDADES.find((item) => item.name === name)?.Icon ?? Wrench;
            return (
              <div key={name} className="border-t border-cream/15 py-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-copper-light shrink-0" aria-hidden="true" />
                <span className="text-sm text-cream/85">{name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* TÉCNICOS DISPONÍVEIS */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Técnicos disponíveis</h2>
            <p className="text-sm text-cream/75 mt-2">Perfis verificados e liberados para receber chamados.</p>
          </div>
          <Button as={Link} href="/cadastro" variant="outline">Buscar técnico</Button>
        </div>
        {tecnicos.length === 0 ? (
          <EmptyState
            title="Nenhum técnico disponível agora"
            description="Os perfis verificados aparecem aqui quando ativam a disponibilidade. Você também pode se cadastrar como técnico."
            href="/cadastro?perfil=tecnico"
            actionLabel="Cadastrar como técnico"
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {tecnicos.map((tecnico) => (
              <Card key={tecnico.user_id}>
                <p className="text-xs text-circuit flex items-center gap-2"><span className="status-pulse" aria-hidden="true" />Disponível</p>
                <h3 className="font-display text-lg font-semibold mt-3">{tecnico.name}</h3>
                <p className="text-sm text-cream/75 mt-2 line-clamp-3">{tecnico.bio || "Profissional verificado no ChamaTech."}</p>
                <p className="text-xs text-cream/75 mt-4">{(tecnico.especialidades ?? []).join(" · ") || "Especialidades em atualização"}</p>
                <p className="mt-4 text-sm text-amber" aria-label={Number(tecnico.total_reviews) >= 3 ? `Nota ${Number(tecnico.average_rating).toFixed(1)} de 5` : "Novo no ChamaTech"}>
                  {Number(tecnico.total_reviews) >= 3 ? `★ ${Number(tecnico.average_rating).toFixed(1)} · ${tecnico.total_reviews} avaliações` : "Novo"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* AVALIAÇÕES REAIS */}
      {avaliacoes.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="font-display text-3xl font-bold mb-8">Avaliações de atendimentos concluídos</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {avaliacoes.map((avaliacao, index) => (
              <Card key={`${avaliacao.tecnico}-${index}`}>
                <p className="text-amber text-sm" role="img" aria-label={`${avaliacao.rating} de 5 estrelas`}>
                  {"★".repeat(avaliacao.rating)}{"☆".repeat(5 - avaliacao.rating)}
                </p>
                <p className="text-sm text-cream/85 mt-3">“{avaliacao.comment}”</p>
                <p className="text-xs text-cream/75 mt-4">Atendimento por {avaliacao.tecnico}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* DÚVIDAS FREQUENTES */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl font-bold mb-6">Dúvidas frequentes</h2>
        <div className="max-w-3xl divide-y divide-cream/15 border-y border-cream/15">
          <details className="py-4">
            <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Como abro um chamado?</summary>
            <p className="text-sm text-cream/75 mt-3">Crie uma conta, descreva o problema e escolha a especialidade ou um técnico disponível.</p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Como os técnicos são verificados?</summary>
            <p className="text-sm text-cream/75 mt-3">A equipe revisa o perfil antes de liberar o técnico para aparecer na busca e aceitar chamados.</p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">O ChamaTech processa pagamentos?</summary>
            <p className="text-sm text-cream/75 mt-3">Ainda não. Combine o valor e a forma de pagamento diretamente com o técnico antes do atendimento.</p>
          </details>
        </div>
        <Link href="/ajuda" className="inline-block mt-5 text-sm text-copper-light underline underline-offset-4">Acessar a central de ajuda</Link>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="border border-cream/15 rounded-card bg-paper p-7 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Pronto para resolver seu problema?</h2>
            <p className="text-sm text-cream/75 mt-2">Abra um chamado e acompanhe o atendimento em um só lugar.</p>
          </div>
          <Button as={Link} href="/cadastro">Criar conta e começar</Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
