import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AdminFilterTabItem {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

/** Baris tab filter seragam untuk halaman pengelolaan Admin (Operate mode). */
export function AdminFilterTabs({
  label,
  items,
}: {
  label: string;
  items: AdminFilterTabItem[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            item.active
              ? "border-brand-700 bg-brand-800 text-white"
              : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-ink",
          )}
        >
          <span>{item.label}</span>
          {typeof item.count === "number" ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                item.active ? "bg-white/20 text-white" : "bg-surface-muted text-ink-muted",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
