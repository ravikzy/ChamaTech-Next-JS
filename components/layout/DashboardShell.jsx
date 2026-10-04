import Link from "next/link";
import { Wrench } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";
import { SidebarNav, MobileNav } from "@/components/layout/Nav";
import { NotificationBell } from "@/components/layout/NotificationBell";


export function DashboardShell({ title, protocol, navItems = [], user, children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-cream/10 p-5 hidden md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-2 font-display uppercase tracking-wide text-copper mb-8">
          <Wrench className="w-4 h-4" />
          VivaTech
        </Link>
        <SidebarNav navItems={navItems} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-cream/10 flex items-center justify-between px-4 md:px-10">
          <div className="flex items-center gap-2">
            <MobileNav navItems={navItems} />
            <Link href="/" className="flex items-center gap-2 font-display uppercase tracking-wide text-copper md:hidden">
              <Wrench className="w-4 h-4" />
            </Link>
          </div>
          <span className="hidden md:block" />
          {user && (
            <div className="flex items-center gap-1">
              <NotificationBell userId={user.id} />
              <UserMenu user={user} dark />
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-10">
          <div className="flex items-baseline justify-between mb-8">
            <h1 className="font-display text-2xl font-bold tracking-wide">{title}</h1>
            {protocol && <span className="protocol-tag text-xs text-cream/50">{protocol}</span>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
