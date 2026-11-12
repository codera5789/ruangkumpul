import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KumpulMotif } from "@/components/shared/kumpul-motif";

export const metadata: Metadata = {
  title: "Koneksi Offline · RuangKumpul",
  description: "Koneksi internet terputus. Akses tools gratis yang telah tersimpan di cache peramban.",
};

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-secondary px-4 text-center">
      <KumpulMotif className="absolute -top-32 -right-32 size-96 text-brand-800/5 pointer-events-none" />

      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-card">
          <WifiOff className="size-8" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Kamu sedang offline
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Koneksi internet tidak terdeteksi pada perangkatmu. Berita baiknya,
          katalog web tools yang pernah kamu buka tetap dapat dijalankan penuh
          langsung di dalam peramban ini.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/tools">
              <Wrench className="size-4" aria-hidden="true" />
              Buka Ruang Tools
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/">Coba Halaman Beranda</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
