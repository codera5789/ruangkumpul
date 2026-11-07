"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-secondary px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">Ada yang salah</h1>
      <p className="mt-2 max-w-md text-sm text-ink-secondary">
        Terjadi kesalahan tak terduga. Coba lagi; jika masih berlanjut,
        hubungi kami melalui halaman kontak.
      </p>
      <Button onClick={reset} className="mt-7">
        Coba Lagi
      </Button>
    </main>
  );
}
