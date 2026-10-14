import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <p className="text-xs uppercase tracking-wide text-copper">Modelo para revisão jurídica</p>
        <h1 className="font-display text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-sm text-ink/75">
          Este texto é um modelo informativo e deve ser revisado por advogado antes do lançamento público do ChamaTech.
        </p>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Dados usados</h2>
          <p className="text-sm text-ink/75">
            Podemos tratar nome, e-mail, telefone, endereço informado para o atendimento, dados aproximados de localização,
            mensagens do chamado, avaliações e registros de segurança para operar a plataforma e prestar suporte.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Acesso e compartilhamento</h2>
          <p className="text-sm text-ink/75">
            O perfil público do técnico pode exibir nome, especialidades, biografia e avaliações. Informações de contato e o
            endereço do atendimento são compartilhados com a outra parte somente quando necessários ao chamado. Não exibimos
            telefone ou coordenadas exatas na busca pública.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Seus direitos</h2>
          <p className="text-sm text-ink/75">
            Para solicitar acesso, correção ou exclusão de dados, entre em contato pelo e-mail de suporte configurado pelo
            ChamaTech. O prazo e os procedimentos serão detalhados nesta política após revisão jurídica.
          </p>
        </section>
        <p className="text-xs text-ink/75">Revisado em 14/10/2026. Este modelo não substitui orientação jurídica.</p>
      </main>
      <Footer />
    </>
  );
}
