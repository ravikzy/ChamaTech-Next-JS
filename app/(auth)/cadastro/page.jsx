"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { formatPhoneBR } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// O cadastro sempre nasce como "client". O perfil técnico só é solicitado
// depois da confirmação do e-mail.
function CadastroForm() {
  const params = useSearchParams();
  const isTechnician = params.get("perfil") === "tecnico";
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

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
      termsAccepted: form.get("termsAccepted") === "on",
      callbackURL: `${window.location.origin}/email-verificado?perfil=${isTechnician ? "tecnico" : "cliente"}`,
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || "Não foi possível criar a conta.");
      return;
    }
    setCreated(true);
  }

  if (created) {
    return (
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-xl mb-2">Confirme seu e-mail</h1>
        <p className="text-sm text-ink/75">
          Enviamos um link para o endereço informado. Confirme a conta para entrar e abrir ou aceitar chamados.
        </p>
        {isTechnician && (
          <p className="text-sm text-ink/75 mt-3">Depois da confirmação, seu perfil técnico será configurado.</p>
        )}
        <p className="text-sm mt-5"><Link className="text-copper underline" href="/login">Ir para entrar</Link></p>
      </Card>
    );
  }
  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-xl mb-1">
        {isTechnician ? "Cadastro de técnico" : "Criar conta"}
      </h1>
      <p className="text-sm text-ink/75 mb-6">
        {isTechnician
          ? "Seu cadastro passa por verificação antes de ficar disponível na busca."
          : "Leva menos de um minuto."}
      </p>

      <form method="post" onSubmit={handleSubmit} className="space-y-4">
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
        <label className="flex items-start gap-2 text-xs text-ink/75 leading-5">
          <input type="checkbox" name="termsAccepted" value="on" required className="mt-1 accent-[var(--color-copper)]" />
          <span>
            Li e aceito os <Link className="text-copper underline" href="/termos" target="_blank" rel="noreferrer">Termos de Uso</Link>
            {" e a "}
            <Link className="text-copper underline" href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</Link>.
          </span>
        </label>
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
