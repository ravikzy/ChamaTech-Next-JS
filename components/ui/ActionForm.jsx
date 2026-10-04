"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";


export function ActionForm({ action, className, children }) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="text-sm text-danger mt-3">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-circuit mt-3">
          {state.ok}
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
