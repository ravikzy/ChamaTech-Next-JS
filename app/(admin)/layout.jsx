import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NAV_BY_ROLE, TITLE_BY_ROLE } from "@/lib/nav";

export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/painel-redirecionamento");

  return (
    <DashboardShell title={TITLE_BY_ROLE.admin} navItems={NAV_BY_ROLE.admin} user={session.user}>
      {children}
    </DashboardShell>
  );
}
