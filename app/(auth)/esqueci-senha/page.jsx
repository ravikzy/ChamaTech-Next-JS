"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function EsqueciSenhaPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const { error } = await requestPasswordReset({
      email: form.get("email"),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setMessage(error
      ? "Não foi possível processar agora. Tente novamente mais tarde."
      : "Se houver uma conta para esse e-mail, enviaremos um link para redefinir a senha.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-xl mb-1">Recuperar senha</h1>
        <p className="text-sm text-ink/75 mb-6">Informe seu e-mail para receber um link de recuperação.</p>
        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" name="email" type="email" label="E-mail" required maxLength={254} />
          {message && <p role="status" className="text-sm text-ink/75">{message}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
        <p className="text-sm mt-5"><Link href="/login" className="text-copper underline">Voltar para entrar</Link></p>
      </Card>
    </main>
  );
}
