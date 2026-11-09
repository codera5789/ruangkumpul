import { UsersRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { KumpulMotif } from "@/components/shared/kumpul-motif";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main-content" tabIndex={-1} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-secondary px-4 py-10">
      <KumpulMotif className="absolute -top-24 -left-24 size-80 text-brand-800/5 dark:text-brand-300/10" />
      <KumpulMotif className="absolute -right-28 -bottom-28 size-96 text-brand-800/5 dark:text-brand-300/10" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 animate-slide-up-far">
          <Logo />
          <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
            <UsersRound className="size-4 text-brand-700" aria-hidden="true" />
            Satu akun untuk tools, artikel, komunitas, dan event.
          </p>
        </div>

        <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8 animate-slide-up-far [animation-delay:120ms]">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted animate-fade-in [animation-delay:350ms]">
          Dengan melanjutkan, kamu menyetujui{" "}
          <Link href="/syarat" className="underline underline-offset-2 transition-colors hover:text-ink-secondary">
            Syarat &amp; Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privasi" className="underline underline-offset-2 transition-colors hover:text-ink-secondary">
            Kebijakan Privasi
          </Link>{" "}
          RuangKumpul.
        </p>
      </div>
    </main>
  );
}
