import { UsersRound } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="RuangKumpul — Beranda"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-800 text-white">
        <UsersRound className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Ruang<span className="text-brand-800">Kumpul</span>
      </span>
    </Link>
  );
}
