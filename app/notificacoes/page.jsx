import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NAV_BY_ROLE, TITLE_BY_ROLE } from "@/lib/nav";
import { marcarComoLida, marcarTodasComoLidas } from "@/app/actions/notificacoes";
import { formatDateBR } from "@/lib/utils";

// Fora dos grupos de rota porque serve aos três papéis: monta o painel
// certo (menu e título) a partir do papel da sessão.
export default async function Notificacoes() {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (!NAV_BY_ROLE[role]) redirect("/login");

  const { rows } = await query(
    `select id, title, body, read, created_at from notifications
      where user_id = $1 order by created_at desc limit 50`,
    [session.user.id]
  );
  const naoLidas = rows.filter((n) => !n.read).length;

  return (
    <DashboardShell title={TITLE_BY_ROLE[role]} navItems={NAV_BY_ROLE[role]} user={session.user}>
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg">
            Notificações{naoLidas > 0 ? ` (${naoLidas} não lidas)` : ""}
          </h2>
          {naoLidas > 0 && (
            <form action={marcarTodasComoLidas}>
              <Button type="submit" variant="outline">
                Marcar todas como lidas
              </Button>
            </form>
          )}
        </div>

        {rows.length === 0 && (
          <Card>
            <p className="text-sm text-ink/70">Você não tem notificações.</p>
          </Card>
        )}

        {rows.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-70" : "border border-copper/40"}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-sm">
                  {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-amber mr-2" aria-label="Não lida" />}
                  {n.title}
                </p>
                {n.body && <p className="text-sm text-ink/70 mt-1">{n.body}</p>}
                <p className="text-xs text-ink/40 mt-2">{formatDateBR(n.created_at)}</p>
              </div>
              {!n.read && (
                <form action={marcarComoLida}>
                  <input type="hidden" name="id" value={n.id} />
                  <Button type="submit" variant="ghost" className="text-xs px-3 py-1.5">
                    Marcar como lida
                  </Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
