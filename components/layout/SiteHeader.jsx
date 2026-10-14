import Link from "next/link";
import { headers } from "next/headers";
import { Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileNav } from "@/components/layout/Nav";
import { NAV_BY_ROLE } from "@/lib/nav";

const PAINEL_BY_ROLE = { client: "/painel", technician: "/painel-tecnico", admin: "/usuarios" };
const PUBLIC_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#especialidades", label: "Especialidades" },
  { href: "/ajuda", label: "Ajuda" },
];

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const mobileLinks = session
    ? [...(NAV_BY_ROLE[session.user.role] ?? []), ...PUBLIC_LINKS]
    : [...PUBLIC_LINKS, { href: "/login", label: "Entrar" }, { href: "/cadastro", label: "Criar conta" }];

  return (
    <header className="border-b border-cream/10 sticky top-0 z-40 bg-workbench/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="md:hidden"><MobileNav navItems={mobileLinks} /></div>
          <Link href="/" className="flex items-center gap-2 font-display font-semibold">
            <Wrench className="w-5 h-5 text-copper" />
            ChamaTech
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-5" aria-label="Navegação principal">
          {PUBLIC_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-cream/75 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm">
              {item.label}
            </Link>
          ))}
        </nav>

        {session ? (
          <div className="flex items-center gap-4">
            <Button as={Link} href={PAINEL_BY_ROLE[session.user.role] || "/painel"} variant="ghost">
              Meu painel
            </Button>
            <UserMenu user={session.user} dark />
          </div>
        ) : (
          <nav className="flex items-center gap-3">
            <Button as={Link} href="/login" variant="ghost">
              Entrar
            </Button>
            <Button as={Link} href="/cadastro" variant="primary">
              Abrir chamado
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
