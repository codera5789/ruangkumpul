import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, SearchX, Users, Wrench } from "lucide-react";
import { SearchInput } from "@/components/layout/search-input";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { listTopCommunities } from "@/modules/community/services";
import { listPublishedArticles } from "@/modules/knowledge/services";
import { TOOLS } from "@/modules/tools/tools-registry/registry";

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari tools, artikel, komunitas, dan diskusi di RuangKumpul.",
  robots: { index: false },
};

interface SearchResult {
  type: "tool" | "article" | "community";
  title: string;
  description: string;
  href: string;
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results: SearchResult[] = [];

  if (query.length >= 2) {
    const lower = query.toLowerCase();

    // Tools dicari dari registry (statis, cepat).
    for (const tool of TOOLS) {
      if (
        tool.name.toLowerCase().includes(lower) ||
        tool.description.toLowerCase().includes(lower) ||
        tool.keywords.some((k) => k.toLowerCase().includes(lower))
      ) {
        results.push({
          type: "tool",
          title: tool.name,
          description: tool.description,
          href: tool.route,
        });
      }
    }

    // Artikel & komunitas dari database (ILIKE search).
    const [{ articles }, communities] = await Promise.all([
      listPublishedArticles({ page: 1, pageSize: 50 }),
      listTopCommunities(50),
    ]);

    for (const article of articles) {
      if (
        article.title.toLowerCase().includes(lower) ||
        (article.excerpt ?? "").toLowerCase().includes(lower)
      ) {
        results.push({
          type: "article",
          title: article.title,
          description: article.excerpt ?? "",
          href: `/artikel/${article.slug}`,
        });
      }
    }

    for (const community of communities) {
      if (
        community.name.toLowerCase().includes(lower) ||
        (community.description ?? "").toLowerCase().includes(lower)
      ) {
        results.push({
          type: "community",
          title: community.name,
          description: community.description ?? "",
          href: `/komunitas/${community.slug}`,
        });
      }
    }
  }

  const typeMeta = {
    tool: { label: "Tool", icon: Wrench, color: "bg-brand-50 text-brand-700" },
    article: { label: "Artikel", icon: FileText, color: "bg-accent-50 text-accent-700" },
    community: { label: "Komunitas", icon: Users, color: "bg-emerald-50 text-emerald-700" },
  } as const;

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pencarian</h1>

        <div className="mt-5">
          <SearchInput defaultValue={query} autoFocus />
        </div>

        {query.length < 2 ? (
          <div className="mt-10">
            <p className="text-center text-sm text-ink-secondary">
              Ketik minimal 2 karakter untuk mencari tools, artikel, dan komunitas.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["json", "pdf", "qr code", "password", "kalkulator"].map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="rounded-full border border-slate-200 bg-surface px-4 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:border-brand-300 hover:text-brand-800"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="mt-8 text-sm text-ink-secondary" aria-live="polite">
              <strong className="text-ink">{results.length}</strong> hasil untuk{" "}
              <strong className="text-ink">“{query}”</strong>
            </p>
            <ul className="mt-4 space-y-3">
              {results.slice(0, 30).map((result, i) => {
                const meta = typeMeta[result.type];
                return (
                  <li key={`${result.href}-${i}`}>
                    <Card className="p-4 transition-shadow hover:shadow-card-hover">
                      <Link href={result.href} className="flex items-start gap-3.5">
                        <span
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                        >
                          <meta.icon className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                            {meta.label}
                          </p>
                          <p className="mt-0.5 font-bold text-ink">{result.title}</p>
                          {result.description ? (
                            <p className="mt-0.5 line-clamp-2 text-sm text-ink-secondary">
                              {result.description}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted">
              <SearchX className="size-6 text-ink-muted" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-ink">
                Tidak ada hasil untuk “{query}”
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                Coba kata kunci lain, atau jelajahi{" "}
                <Link href="/tools" className="font-semibold text-brand-700 hover:underline">
                  direktori tools
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
