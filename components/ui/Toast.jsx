"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, tone = "success") => {
    clearTimeout(timerRef.current);
    setToast({ message, tone, id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-card border border-cream/15 bg-paper p-4 text-sm text-ink shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <p role={toast.tone === "error" ? "alert" : "status"} className={toast.tone === "error" ? "text-danger" : "text-ink"}>
              {toast.message}
            </p>
            <button type="button" aria-label="Dispensar aviso" onClick={() => setToast(null)} className="-mr-2 -mt-2 rounded-control p-2 text-ink/75 hover:bg-workbench-soft">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return showToast;
}
