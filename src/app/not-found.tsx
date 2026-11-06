import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-secondary px-4 text-center">
      <p className="text-7xl font-extrabold text-brand-800">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-ink-secondary">
        Halaman yang kamu cari mungkin sudah dipindahkan atau tidak pernah ada.
        Yuk kembali menjelajah.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Compass className="size-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tools">Jelajahi Tools</Link>
        </Button>
      </div>
    </main>
  );
}
