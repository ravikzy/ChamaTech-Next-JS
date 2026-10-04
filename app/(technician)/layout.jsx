import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NAV_BY_ROLE, TITLE_BY_ROLE } from "@/lib/nav";

export default async function TechnicianLayout({ children }) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.user.role !== "technician") redirect("/painel-redirecionamento");

  return (
    <DashboardShell title={TITLE_BY_ROLE.technician} navItems={NAV_BY_ROLE.technician} user={session.user}>
      {children}
    </DashboardShell>
  );
}
