"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirmPassword")) {
      setMessage("As senhas não são iguais.");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword({ newPassword: password, token });
    setLoading(false);
    setMessage(error ? "O link expirou ou é inválido. Solicite uma nova recuperação." : "Senha atualizada. Você já pode entrar.");
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-xl mb-1">Criar nova senha</h1>
      {!token ? (
        <p className="text-sm text-ink/75 mt-4">Link inválido ou incompleto. <Link href="/esqueci-senha" className="text-copper underline">Solicite outro</Link>.</p>
      ) : (
        <form method="post" onSubmit={handleSubmit} className="space-y-4 mt-5">
          <Input id="password" name="password" type="password" label="Nova senha" minLength={8} maxLength={128} required />
          <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirme a senha" minLength={8} maxLength={128} required />
          {message && <p role="status" className="text-sm text-ink/75">{message}</p>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar senha"}</Button>
        </form>
      )}
      <p className="text-sm mt-5"><Link href="/login" className="text-copper underline">Voltar para entrar</Link></p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return <main className="min-h-screen flex items-center justify-center px-6"><Suspense fallback={null}><ResetPasswordForm /></Suspense></main>;
}
