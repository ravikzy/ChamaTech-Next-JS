import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateBR } from "@/lib/utils";

const ROLE_TONE = { client: "pending", technician: "accepted", admin: "disputed" };
const ROLE_LABEL = { client: "Cliente", technician: "Técnico", admin: "Admin" };

export default async function Usuarios({ searchParams }) {
  await requireRole("admin");
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim().slice(0, 100) : "";
  const papel = ["client", "technician", "admin"].includes(params?.papel) ? params.papel : "";

  const condicoes = [];
  const valores = [];
  if (papel) {
    valores.push(papel);
    condicoes.push(`role = $${valores.length}`);
  }
  if (q) {
    // Escapa % e _ para a busca ser literal.
    valores.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
    condicoes.push(`(name ilike $${valores.length} or email ilike $${valores.length})`);
  }
  const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

  const { rows } = await query(
    `select id, name, email, role, "createdAt" as created_at
       from "user" ${where} order by "createdAt" desc limit 100`,
    valores
  );

  return (
    <div className="space-y-4">
      <Card>
        <form method="get" className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou e-mail"
            className="flex-1 rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream placeholder:text-cream/75 focus:outline-none focus:ring-2 focus:ring-copper"
          />
          <select
            name="papel"
            defaultValue={papel}
            className="rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-copper"
          >
            <option value="">Todos os papéis</option>
            <option value="client">Clientes</option>
            <option value="technician">Técnicos</option>
            <option value="admin">Admins</option>
          </select>
          <Button type="submit">Filtrar</Button>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-ink/75 text-xs uppercase border-b border-ink/10">
                <th className="pb-2">Nome</th>
                <th className="pb-2">E-mail</th>
                <th className="pb-2">Papel</th>
                <th className="pb-2">Desde</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-ink/75">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-ink/5">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 text-ink/75">{u.email}</td>
                  <td className="py-2">
                    <Badge tone={ROLE_TONE[u.role] || "pending"}>{ROLE_LABEL[u.role] || u.role}</Badge>
                  </td>
                  <td className="py-2 text-ink/75">{formatDateBR(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink/75 mt-3">Mostrando até 100 resultados, dos mais recentes.</p>
      </Card>
    </div>
  );
}
