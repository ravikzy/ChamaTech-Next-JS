"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ErrorState({ error, reset, href = "/", label = "Voltar ao início" }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="max-w-md">
      <p className="protocol-tag text-xs text-amber">Algo deu errado</p>
      <h1 className="font-display text-xl font-bold mt-2">Não conseguimos carregar esta página</h1>
      <p className="text-sm text-ink/70 mt-2">
        Foi um problema nosso. Tente novamente; se continuar, volte mais tarde.
      </p>
      <div className="flex flex-wrap gap-3 mt-5">
        <Button type="button" onClick={() => reset()}>
          Tentar de novo
        </Button>
        <Button as={Link} href={href} variant="outline">
          {label}
        </Button>
      </div>
    </Card>
  );
}
