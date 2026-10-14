"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

function EmailVerificadoConteudo() {
  const params = useSearchParams();
  const [message, setMessage] = useState("E-mail confirmado. Preparando sua conta...");

  useEffect(() => {
    let active = true;
    async function concluir() {
      if (params.get("perfil") !== "tecnico") {
        if (active) setMessage("E-mail confirmado. Você já pode entrar no ChamaTech.");
        return;
      }
      const response = await fetch("/api/tornar-tecnico", { method: "POST" });
      if (active) {
        setMessage(response.ok
          ? "E-mail confirmado e perfil técnico configurado. Entre para continuar."
          : "E-mail confirmado. Entre para concluir a configuração do perfil técnico.");
      }
    }
    concluir().catch(() => {
      if (active) setMessage("E-mail confirmado. Entre para concluir a configuração da conta.");
    });
    return () => { active = false; };
  }, [params]);

  return (
    <Card className="w-full max-w-sm">
      <h1 className="font-display text-xl mb-2">Confirmação de e-mail</h1>
      <p role="status" className="text-sm text-ink/75">{message}</p>
      <Link href={params.get("perfil") === "tecnico" ? "/login?perfil=tecnico" : "/login"} className="inline-block mt-5 text-copper underline">
        Ir para entrar
      </Link>
    </Card>
  );
}

export default function EmailVerificadoPage() {
  return <main className="min-h-screen flex items-center justify-center px-6"><Suspense fallback={null}><EmailVerificadoConteudo /></Suspense></main>;
}
