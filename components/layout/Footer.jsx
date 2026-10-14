import Link from "next/link";
import { Wrench } from "lucide-react";

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
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Central de ajuda", href: "/ajuda" },
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
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
              ChamaTech
            </div>
            <p className="text-sm text-cream/75 mt-3 max-w-xs">
              Encontre profissionais de TI, acompanhe o chamado por etapas e avalie o atendimento.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="protocol-tag text-xs uppercase text-cream/75 mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-cream/75 hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tear-line mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/75">
          <p>© {new Date().getFullYear()} ChamaTech</p>
          <p className="protocol-tag">São Paulo · SP</p>
        </div>
      </div>
    </footer>
  );
}
