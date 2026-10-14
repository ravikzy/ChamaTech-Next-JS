import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("rounded-control bg-cream/10 motion-safe:animate-pulse", className)} />;
}

export function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando">
      <Skeleton className="h-8 w-56" />
      <div className="grid sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}

export function EmptyState({ title, description, href, actionLabel }) {
  return (
    <Card className="max-w-xl">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="text-sm text-ink/75 mt-2">{description}</p>
      {href && actionLabel && (
        <Button as={Link} href={href} className="mt-5">{actionLabel}</Button>
      )}
    </Card>
  );
}

export function NotFoundState({ href = "/", label = "Voltar ao início" }) {
  return (
    <Card className="max-w-md">
      <p className="protocol-tag text-xs text-copper-light">404</p>
      <h1 className="font-display text-xl font-bold mt-2">Página não encontrada</h1>
      <p className="text-sm text-ink/75 mt-2">
        O endereço não existe ou você não tem acesso a este conteúdo.
      </p>
      <Button as={Link} href={href} className="mt-5">
        {label}
      </Button>
    </Card>
  );
}
