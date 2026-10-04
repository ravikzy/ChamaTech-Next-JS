"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { formatPhoneBR } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// O cadastro sempre nasce como "client". Se vier de ?perfil=tecnico, a rota
// /api/tornar-tecnico promove a conta no servidor logo depois.
function CadastroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isTechnician = params.get("perfil") === "tecnico";
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  const form = new FormData(e.currentTarget);

  const { error: signUpError } = await signUp.email({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    phone,
  });

  if (signUpError) {
    setLoading(false);
    setError(signUpError.message || "Não foi possível criar a conta.");
    return;
  }

  if (isTechnician) {
    const res = await fetch("/api/tornar-tecnico", { method: "POST" });
    if (!res.ok) {
      setLoading(false);
      setError("Conta criada, mas não foi possível configurar o perfil de técnico.");
      return;
    }
  }

  setLoading(false);
  router.push(isTechnician ? "/painel-tecnico" : "/painel");
}
  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-xl mb-1">
        {isTechnician ? "Cadastro de técnico" : "Criar conta"}
      </h1>
      <p className="text-sm text-ink/60 mb-6">
        {isTechnician
          ? "Seu cadastro passa por verificação antes de ficar disponível na busca."
          : "Leva menos de um minuto."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" name="name" label="Nome completo" required />
        <Input id="email" name="email" type="email" label="E-mail" required />
        <Input
          id="phone"
          name="phone"
          label="Telefone"
          value={phone}
          onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
          placeholder="(11) 91234-5678"
          required
        />
        <Input id="password" name="password" type="password" label="Senha" minLength={8} required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </Card>
  );
}

export default function CadastroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Suspense fallback={null}>
        <CadastroForm />
      </Suspense>
    </main>
  );
}