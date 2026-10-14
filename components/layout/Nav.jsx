"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

function ativo(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Links do menu lateral (desktop), com o item atual destacado. */
export function SidebarNav({ navItems }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu principal">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={ativo(pathname, item.href) ? "page" : undefined}
          className={cn(
            "px-3 py-2 rounded-control text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            ativo(pathname, item.href)
              ? "bg-workbench-soft text-cream font-medium"
              : "text-cream/80 hover:bg-workbench-soft hover:text-cream"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav({ navItems }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = panelRef.current?.querySelectorAll('a, button:not([disabled])');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        className="p-2 -ml-2 rounded-lg text-cream hover:bg-workbench-soft"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside ref={panelRef} id="mobile-navigation-panel" role="dialog" aria-modal="true" aria-label="Navegação" className="absolute left-0 top-0 h-full w-64 bg-workbench border-r border-cream/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/"
                className="flex items-center gap-2 font-display uppercase tracking-wide text-copper"
              >
                <Wrench className="w-4 h-4" />
                ChamaTech
              </Link>
              <button
                type="button"
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="p-1.5 rounded-lg text-cream/75 hover:bg-workbench-soft"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarNav navItems={navItems} />
          </aside>
        </div>
      )}
    </div>
  );
}
