import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Ponto único de saída quando alguém tenta acessar um painel que não é do
// seu papel — manda pro painel certo (ou pro login, se não tiver sessão).
export default async function PainelRedirecionamento() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const byRole = {
    client: "/painel",
    technician: "/painel-tecnico",
    admin: "/painel-admin",
  };
  redirect(byRole[session.user.role] || "/login");
}
