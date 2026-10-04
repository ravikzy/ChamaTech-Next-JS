import Link from "next/link";
import { Wrench, Instagram, MessageCircle } from "lucide-react";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Especialidades", href: "#especialidades" },
      { label: "Emergência", href: "/cadastro" },
    ],
  },
  {
    title: "Para técnicos",
    links: [
      { label: "Seja um técnico parceiro", href: "/cadastro?perfil=tecnico" },
      { label: "Como funcionam os repasses", href: "#" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Central de ajuda", href: "#" },
      { label: "Fale conosco", href: "#" },
      { label: "Termos de uso", href: "#" },
      { label: "Privacidade (LGPD)", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-cream/10 workbench-texture">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2 font-display uppercase tracking-wide text-lg">
              <Wrench className="w-5 h-5 text-copper" />
              VivaTech
            </div>
            <p className="text-sm text-cream/50 mt-3 max-w-xs">
              Conserto de computador, celular e mais — com técnico verificado
              perto de você, protocolo de acompanhamento e pagamento só
              depois do serviço concluído.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" aria-label="WhatsApp" className="w-9 h-9 rounded-full border border-cream/15 flex items-center justify-center hover:bg-workbench-soft hover:border-cream/30">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full border border-cream/15 flex items-center justify-center hover:bg-workbench-soft hover:border-cream/30">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="protocol-tag text-xs uppercase text-cream/40 mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-cream/70 hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tear-line mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/40">
          <p>© {new Date().getFullYear()} VivaTech — protótipo de arquitetura, não um serviço real.</p>
          <p className="protocol-tag">São Paulo · SP</p>
        </div>
      </div>
    </footer>
  );
}
