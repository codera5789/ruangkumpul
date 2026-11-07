"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, MessageSquare, Search, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: "tool" | "article" | "community" | "post";
  title: string;
  href: string;
}

const typeIcons = {
  tool: Wrench,
  article: FileText,
  community: Users,
  post: MessageSquare,
} as const;

interface SearchInputProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  defaultValue?: string;
}

/** Form pencarian global (GET ke /search) dengan dropdown autocomplete. */
export function SearchInput({
  className,
  placeholder = "Cari tools, artikel, komunitas, dan lainnya...",
  autoFocus,
  defaultValue,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced fetch saran. Pengosongan juga lewat timer agar tidak ada
  // setState sinkron di body effect (aturan react-hooks/set-state-in-effect).
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const q = value.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        // dibatalkan/gagal — abaikan
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Tutup dropdown saat klik di luar / Escape.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form action="/search" role="search" onSubmit={() => setOpen(false)}>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Cari di RuangKumpul"
          aria-expanded={open}
          role="combobox"
          aria-controls="search-suggestions"
          className="h-11 w-full rounded-xl border border-slate-200 bg-surface pr-4 pl-10 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
        />
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="animate-slide-up absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-card border border-slate-200 bg-surface py-1.5 shadow-lg"
        >
          {suggestions.map((s) => {
            const Icon = typeIcons[s.type];
            return (
              <li key={`${s.type}-${s.href}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => go(s.href)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="truncate text-ink">{s.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-ink-muted capitalize">
                    {s.type === "post" ? "diskusi" : s.type}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
