import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <p className="text-xs uppercase tracking-wide text-copper">Modelo para revisão jurídica</p>
        <h1 className="font-display text-3xl font-bold">Termos de Uso</h1>
        <p className="text-sm text-ink/75">
          Este texto é um modelo informativo e deve ser revisado por advogado antes do lançamento público do ChamaTech.
        </p>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Como a plataforma funciona</h2>
          <p className="text-sm text-ink/75">
            O ChamaTech conecta pessoas que precisam de assistência de TI a profissionais cadastrados. A plataforma organiza
            solicitações, atualizações do atendimento e avaliações. A contratação, o escopo e o preço devem ser confirmados
            pelas partes antes do serviço.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Responsabilidades</h2>
          <p className="text-sm text-ink/75">
            Clientes e técnicos devem fornecer informações verdadeiras, manter seus dados de acesso seguros e tratar a outra
            parte com respeito. A verificação de um perfil não substitui a avaliação de cada contratação.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Chamados e disputas</h2>
          <p className="text-sm text-ink/75">
            O status do chamado registra as etapas informadas pelas partes. Se houver um problema durante o atendimento,
            o cliente pode abrir uma disputa para análise administrativa.
          </p>
        </section>
        <p className="text-xs text-ink/75">Revisado em 14/10/2026. Este modelo não substitui orientação jurídica.</p>
      </main>
      <Footer />
    </>
  );
}
