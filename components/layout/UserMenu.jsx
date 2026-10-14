"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ROLE_LABEL = { client: "Cliente", technician: "Técnico", admin: "Admin" };
const PERFIL_HREF = { client: "/perfil", technician: "/perfil-tecnico" };

export function UserMenu({ user, dark = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  const initial = user.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors",
          dark ? "hover:bg-workbench-soft text-cream" : "hover:bg-ink/5 text-ink"
        )}
      >
        <span className="w-7 h-7 rounded-full bg-copper text-cream flex items-center justify-center text-xs font-display font-bold">
          {initial}
        </span>
        <span className="text-sm hidden sm:inline">{user.name?.split(" ")[0]}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-paper text-ink rounded-lg border border-cream/10 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-cream/10">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-ink/75">{ROLE_LABEL[user.role] || user.role}</p>
          </div>
          {PERFIL_HREF[user.role] && (
            <Link
              href={PERFIL_HREF[user.role]}
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink/5"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4" /> Meu perfil
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 text-left"
          >
            <LogOut className="w-4 h-4" /> Sair da sessão
          </button>
        </div>
      )}
    </div>
  );
}
