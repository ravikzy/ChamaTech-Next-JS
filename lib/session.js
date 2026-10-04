import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Sessão do usuário logado (ou null). Sempre lida no servidor. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Garante login e papel ANTES de qualquer consulta ao banco.
 * Necessário em cada página (não basta o layout): o Next renderiza layout e
 * página em paralelo, então só o layout não impede a página de buscar dados.
 */
export async function requireRole(role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== role) redirect("/painel-redirecionamento");
  return session;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}
