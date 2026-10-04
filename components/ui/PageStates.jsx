import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Carregando">
      <div className="h-8 w-56 rounded-lg bg-cream/10" />
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-lg bg-cream/10" />
        <div className="h-24 rounded-lg bg-cream/10" />
        <div className="h-24 rounded-lg bg-cream/10" />
      </div>
      <div className="h-40 rounded-lg bg-cream/10" />
    </div>
  );
}

export function NotFoundState({ href = "/", label = "Voltar ao início" }) {
  return (
    <Card className="max-w-md">
      <p className="protocol-tag text-xs text-copper-light">404</p>
      <h1 className="font-display text-xl font-bold mt-2">Página não encontrada</h1>
      <p className="text-sm text-ink/70 mt-2">
        O endereço não existe ou você não tem acesso a este conteúdo.
      </p>
      <Button as={Link} href={href} className="mt-5">
        {label}
      </Button>
    </Card>
  );
}
