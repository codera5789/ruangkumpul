"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityCard } from "@/modules/community/components/community-card";
import type { CommunitySummary } from "@/modules/community/services";

/** Direktori komunitas dengan pencarian instan (client-side). */
export function CommunitySearch({ communities }: { communities: CommunitySummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [communities, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari komunitas..."
          aria-label="Cari komunitas"
          className="h-11 pl-11"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-12 text-center text-sm text-ink-secondary">
          Tidak ada komunitas yang cocok dengan pencarian{" "}
          <strong className="text-ink">“{query}”</strong>.
        </p>
      )}
    </div>
  );
}
