"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, title, onClose, children, className = "" }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    onClose?.();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onMouseDown={(event) => { if (event.target === dialogRef.current) onClose?.(); }}
      className={`w-[calc(100%-2rem)] max-w-lg rounded-card border border-cream/15 bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/70 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
        <h2 id={titleId} className="font-display text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Fechar janela" className="rounded-control p-2 text-ink/75 hover:bg-workbench-soft">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
