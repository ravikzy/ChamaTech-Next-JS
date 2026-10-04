import Link from "next/link";
import { headers } from "next/headers";
import { Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";

const PAINEL_BY_ROLE = { client: "/painel", technician: "/painel-tecnico", admin: "/usuarios" };

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="border-b border-cream/10 sticky top-0 z-40 bg-workbench/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display uppercase tracking-wide">
          <Wrench className="w-5 h-5 text-copper" />
          VivaTech
        </Link>

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
