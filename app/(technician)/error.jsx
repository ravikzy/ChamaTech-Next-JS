"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function Error(props) {
  return <ErrorState {...props} href="/painel-tecnico" label="Ir para o painel" />;
}
