"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ToolCard } from "@/modules/tools/components/tool-card";
import {
  TOOLS,
  TOOL_CATEGORIES,
  type ToolCategorySlug,
} from "@/modules/tools/tools-registry/registry";

/** Direktori tools dengan pencarian instan dan filter kategori (client-side). */
export function ToolDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategorySlug | "semua">("semua");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (category !== "semua" && tool.category !== category) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari tool... mis. json, pdf, qr"
          aria-label="Cari tool"
          className="h-12 pl-11"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter kategori">
        <CategoryChip active={category === "semua"} onClick={() => setCategory("semua")}>
          Semua
        </CategoryChip>
        {TOOL_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.slug}
            active={category === cat.slug}
            onClick={() => setCategory(cat.slug)}
          >
            {cat.name}
          </CategoryChip>
        ))}
      </div>

      {filtered.length > 0 ? (
        <>
          <p className="text-sm text-ink-secondary" aria-live="polite">
            Menampilkan <strong className="text-ink">{filtered.length}</strong> tool
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool, i) => (
              <div
                key={tool.slug}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                className="animate-slide-up-far"
              >
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-slate-300 bg-surface px-6 py-16 text-center animate-slide-up-far">
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted animate-pop-in">
            <SearchX className="size-6 text-ink-muted" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-ink">Tool tidak ditemukan</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Coba kata kunci lain atau reset filter kategori.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("semua");
            }}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Reset pencarian
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95",
        active
          ? "border-brand-800 bg-brand-800 text-white shadow-sm shadow-brand-900/20"
          : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm",
      )}
    >
      {children}
    </button>
  );
}
