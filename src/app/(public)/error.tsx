"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary khusus rute publik — tetap di dalam shell situs
 *  (header/footer tetap tampil, tidak menggantikan seluruh halaman). */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public-error-boundary]", error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">Ada yang salah</h1>
      <p className="mt-2 max-w-md text-sm text-ink-secondary">
        Terjadi kesalahan tak terduga saat menampilkan halaman ini. Coba lagi;
        jika masih berlanjut, hubungi kami melalui halaman kontak.
      </p>
      <Button onClick={reset} className="mt-7">
        Coba Lagi
      </Button>
    </main>
  );
}
