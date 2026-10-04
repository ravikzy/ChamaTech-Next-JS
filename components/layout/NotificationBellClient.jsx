"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";


export function NotificationBellClient({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  useEffect(() => {
    let cancelado = false;
    async function atualizar() {
      try {
        const res = await fetch("/api/notificacoes/contagem", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setCount(data.unread ?? 0);
      } catch {
      }
    }
    atualizar();
    const id = setInterval(atualizar, 30000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [pathname]);

  return (
    <Link
      href="/notificacoes"
      aria-label={count > 0 ? `Notificações (${count} não lidas)` : "Notificações"}
      className="relative p-2 rounded-full text-cream hover:bg-workbench-soft"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber text-workbench text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
