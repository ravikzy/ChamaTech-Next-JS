"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";


export function ActionForm({ action, className, children }) {
  const [state, formAction] = useActionState(action, null);
  const showToast = useToast();

  useEffect(() => {
    if (state?.ok) showToast(state.ok);
  }, [state, showToast]);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="text-sm text-danger mt-3">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, pendingText = "Enviando...", ...props }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
