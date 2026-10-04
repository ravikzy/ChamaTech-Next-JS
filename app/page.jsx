import Link from "next/link";
import {
  MapPin, ShieldCheck, Star, Wrench, MonitorCog,
  Wifi, Printer, Smartphone, Tv, ShieldAlert,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, ProtocolBadge } from "@/components/ui/Card";
import { FramedPhoto } from "@/components/ui/FramedPhoto";
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
  { n: "01", titulo: "Descreva o problema", texto: "Conta o que aconteceu, com foto se quiser — leva menos de um minuto." },
  { n: "02", titulo: "Um técnico aceita", texto: "Técnico verificado da sua região aceita o chamado e você acompanha o status em tempo real." },
  { n: "03", titulo: "Paga só no fim", texto: "O valor é combinado antes, e o pagamento só é liberado com o serviço concluído." },
];

async function getDados() {
  try {
    const [{ rows: depoimentos }, { rows: stats }] = await Promise.all([
      query(
        `select r.rating, r.comment, u.name as cliente, ut.name as tecnico
         from reviews r
         join clients c on c.user_id = r.client_id
         join "user" u on u.id = c.user_id
         join "user" ut on ut.id = r.technician_id
         order by r.created_at desc limit 3`
      ),
      query(
        `select
           (select count(*) from technicians where is_available = true)::int as disponiveis,
           (select count(*) from services where status = 'completed')::int as concluidos`
      ),
    ]);
    return { depoimentos, stats: stats[0] };
  } catch {
    return { depoimentos: [], stats: { disponiveis: 0, concluidos: 0 } };
  }
}

export default async function LandingPage() {
  const { depoimentos, stats } = await getDados();

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <span className="protocol-tag inline-flex items-center gap-2 text-xs text-copper-light border border-copper/25 rounded-full px-3 py-1.5">
              <span className="status-pulse" />
              {stats.disponiveis > 0 ? `${stats.disponiveis} técnicos disponíveis agora` : "Rede de técnicos verificados"}
            </span>

            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mt-5 font-extrabold">
              Assistência técnica
              <br />
              <span className="text-copper-light">que chega até você</span>
            </h1>

            <p className="mt-5 text-cream/60 max-w-md text-lg">
              Abra um chamado, descreva o defeito e um técnico verificado da
              sua região cuida do resto — com preço combinado antes e
              pagamento só depois do serviço concluído.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} href="/cadastro" variant="primary">
                Solicitar assistência
              </Button>
              <Button as={Link} href="/cadastro?perfil=tecnico" variant="outline">
                Sou técnico
              </Button>
            </div>

            <dl className="flex flex-wrap gap-x-8 gap-y-3 mt-10 pt-8 tear-line">
              <div>
                <dt className="text-xs text-cream/40 uppercase tracking-wide">Chamados concluídos</dt>
                <dd className="font-display text-2xl font-bold mt-0.5">{stats.concluidos > 0 ? `${stats.concluidos}+` : "centenas"}</dd>
              </div>
              <div>
                <dt className="text-xs text-cream/40 uppercase tracking-wide">Resposta média</dt>
                <dd className="font-display text-2xl font-bold mt-0.5">‹ 30 min</dd>
              </div>
              <div>
                <dt className="text-xs text-cream/40 uppercase tracking-wide">Satisfação</dt>
                <dd className="font-display text-2xl font-bold mt-0.5">98%</dd>
              </div>
            </dl>
          </div>

          <FramedPhoto
            src="/images/tecnico-bancada.jpg"
            alt="Técnico especializado consertando um aparelho eletrônico"
            className="hidden lg:block"
            floatingCard={
              <div className="flex items-center gap-2.5">
                <span className="status-pulse" />
                <div>
                  <p className="text-sm font-semibold">Carlos A.</p>
                  <p className="text-xs text-cream/50">Disponível agora · 1,2 km</p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* SELOS DE CONFIANÇA */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-4">
        <Card>
          <MapPin className="w-6 h-6 text-copper-light" />
          <h3 className="font-display font-bold mt-3">Perto de você</h3>
          <p className="text-sm text-cream/60 mt-1">
            Busca por proximidade mostra técnicos disponíveis no seu bairro,
            com distância estimada.
          </p>
        </Card>
        <Card>
          <ShieldCheck className="w-6 h-6 text-copper-light" />
          <h3 className="font-display font-bold mt-3">Técnico verificado</h3>
          <p className="text-sm text-cream/60 mt-1">
            Identidade e especialidade conferidas por um admin antes de
            entrar na plataforma.
          </p>
        </Card>
        <Card>
          <Star className="w-6 h-6 text-copper-light" />
          <h3 className="font-display font-bold mt-3">Avaliação real</h3>
          <p className="text-sm text-cream/60 mt-1">
            Cada chamado gera uma nota e um comentário público, visível no
            perfil do técnico.
          </p>
        </Card>
      </section>

      {/* COMO FUNCIONA — sequência real, números fazem sentido aqui */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <h2 className="protocol-tag text-xs uppercase text-copper-light mb-2">Passo a passo</h2>
            <h3 className="font-display text-3xl font-bold mb-8">Como funciona</h3>
            <ol className="space-y-6">
              {PASSOS.map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="font-display text-2xl font-bold text-copper/50">{p.n}</span>
                  <div>
                    <p className="font-display font-semibold">{p.titulo}</p>
                    <p className="text-sm text-cream/55 mt-1">{p.texto}</p>
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
        <h2 className="protocol-tag text-xs uppercase text-copper-light mb-2">Cobertura</h2>
        <h3 className="font-display text-3xl font-bold mb-8">Especialidades atendidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ESPECIALIDADES.map(({ name, Icon }) => (
            <div
              key={name}
              className="border border-cream/10 rounded-xl px-4 py-4 flex items-center gap-3 hover:border-copper/40 hover:bg-paper transition-colors"
            >
              <Icon className="w-5 h-5 text-copper-light shrink-0" />
              <span className="text-sm text-cream/80">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      {depoimentos.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="protocol-tag text-xs uppercase text-copper-light mb-2">Quem já usou</h2>
          <h3 className="font-display text-3xl font-bold mb-8">Avaliações de chamados reais</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {depoimentos.map((d, i) => (
              <Card key={i}>
                <p className="text-amber text-sm">{"★".repeat(d.rating)}{"☆".repeat(5 - d.rating)}</p>
                <p className="text-sm text-cream/80 mt-2">"{d.comment}"</p>
                <p className="text-xs text-cream/40 mt-4 protocol-tag">
                  {d.cliente} · atendido por {d.tecnico}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}