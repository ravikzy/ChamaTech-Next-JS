"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const { error: signInError } = await signIn.email({
      email: form.get("email"),
      password: form.get("password"),
    });

    setLoading(false);
    if (signInError) {
      setError("Não foi possível entrar. Confira seus dados; se a conta ainda não foi confirmada, um novo link será enviado.");
      return;
    }
    if (params.get("perfil") === "tecnico") {
      const response = await fetch("/api/tornar-tecnico", { method: "POST" });
      if (!response.ok) {
        setLoading(false);
        setError("Não foi possível configurar o perfil técnico. Confirme o e-mail e tente novamente.");
        return;
      }
      router.push("/painel-tecnico");
      return;
    }
    // Só aceita caminhos internos (evita redirecionar para sites externos).
    const destino = params.get("redirectTo");
    const seguro = destino && destino.startsWith("/") && !destino.startsWith("//");
    router.push(seguro ? destino : "/painel-redirecionamento");
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-xl mb-1">Entrar</h1>
      <p className="text-sm text-ink/75 mb-6">Acesse sua conta para acompanhar chamados.</p>

      <form method="post" onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" name="email" type="email" label="E-mail" required />
        <Input id="password" name="password" type="password" label="Senha" required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-sm mt-4">
        <Link href="/esqueci-senha" className="text-copper underline">Esqueci minha senha</Link>
      </p>

      <p className="text-sm text-ink/75 mt-5">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-copper underline">
          Cadastre-se
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
