import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  defaultValue?: string;
}

/** Form pencarian global (GET ke /search). */
export function SearchInput({
  className,
  placeholder = "Cari tools, artikel, komunitas, dan lainnya...",
  autoFocus,
  defaultValue,
}: SearchInputProps) {
  return (
    <form action="/search" role="search" className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Cari di RuangKumpul"
        className="h-11 w-full rounded-xl border border-slate-200 bg-surface pr-4 pl-10 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
      />
    </form>
  );
}
