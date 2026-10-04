"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function Error(props) {
  return <ErrorState {...props} href="/usuarios" label="Ir para o painel" />;
}
