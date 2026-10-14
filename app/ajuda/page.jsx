import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { HelpCenter } from "@/components/help/HelpCenter";
import { FAQ_GROUPS } from "@/lib/faq";

export const metadata = {
  title: "Ajuda | ChamaTech",
  description: "Respostas sobre chamados, clientes, técnicos e segurança no ChamaTech.",
};

export default function AjudaPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "";
  return (
    <>
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <header className="max-w-3xl mb-10">
          <p className="protocol-tag text-xs uppercase text-cream/75 mb-3">Central de ajuda</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Como podemos ajudar?</h1>
          <p className="text-cream/75 mt-4">Encontre orientações para usar o marketplace e acompanhar seus chamados.</p>
        </header>
        <HelpCenter groups={FAQ_GROUPS} supportEmail={supportEmail} />
      </main>
      <Footer />
    </>
  );
}
