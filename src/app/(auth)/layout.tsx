import { UsersRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 animate-slide-up-far">
          <Logo />
          <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
            <UsersRound className="size-4 text-brand-700" aria-hidden="true" />
            One Platform. Endless Possibilities.
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
