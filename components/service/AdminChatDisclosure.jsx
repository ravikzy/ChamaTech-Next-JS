"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/service/ChatPanel";

export function AdminChatDisclosure({ serviceId, userId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-ink/10 pt-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}
        className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {open ? "Fechar conversa do chamado" : "Ler conversa do chamado"}
      </button>
      {open && <div className="mt-3"><ChatPanel serviceId={serviceId} userId={userId} readOnly /></div>}
    </div>
  );
}
