"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function Error(props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <ErrorState {...props} />
    </main>
  );
}
