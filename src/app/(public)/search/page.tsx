import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, MessageSquare, SearchX, Users, Wrench } from "lucide-react";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { createClient } from "@/lib/supabase/server";
import { TOOLS } from "@/modules/tools/tools-registry/registry";

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari tools, artikel, komunitas, dan diskusi di RuangKumpul.",
  robots: { index: false },
};

const PAGE_SIZE = 20;

type ResultType = "tool" | "article" | "community" | "post";

interface SearchResult {
  type: ResultType;
  title: string;
  description: string;
  href: string;
}

async function searchDatabase(supabase: Awaited<ReturnType<typeof createClient>>, q: string) {
  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const [articles, communities, posts] = await Promise.all([
    supabase
      .from("articles")
      .select("title, slug, excerpt")
      .eq("status", "published")
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(25),
    supabase
      .from("communities")
      .select("name, slug, description")
      .eq("visibility", "public")
      .eq("status", "active")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("member_count", { ascending: false })
      .limit(25),
    supabase
      .from("posts")
      .select("title, slug, content")
      .eq("status", "published")
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return { articles: articles.data ?? [], communities: communities.data ?? [], posts: posts.data ?? [] };
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: rawQ, page: rawPage } = await searchParams;
  const query = (rawQ ?? "").trim();
  const page = Math.max(1, Math.min(50, Number(rawPage) || 1));

  let results: SearchResult[] = [];
  let totalAvailable = 0;

  if (query.length >= 2) {
    const lower = query.toLowerCase();

    // Tools dari registry statis (instan).
    const toolHits = TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(lower) ||
        tool.description.toLowerCase().includes(lower) ||
        tool.keywords.some((k) => k.toLowerCase().includes(lower)),
    );

    // Konten dinamis dari database — ILIKE memanfaatkan index GIN pg_trgm.
    const supabase = await createClient();
    const { articles, communities, posts } = await searchDatabase(supabase, query);

    results = [
      ...toolHits.map((tool) => ({
        type: "tool" as const,
        title: tool.name,
        description: tool.description,
        href: tool.route,
      })),
      ...articles.map((a) => ({
        type: "article" as const,
        title: a.title,
        description: a.excerpt ?? "",
        href: `/artikel/${a.slug}`,
      })),
      ...communities.map((c) => ({
        type: "community" as const,
        title: c.name,
        description: c.description ?? "",
        href: `/komunitas/${c.slug}`,
      })),
      ...posts.map((p) => ({
        type: "post" as const,
        title: p.title,
        description: p.content.slice(0, 140),
        href: `/diskusi/${p.slug}`,
      })),
    ];

    totalAvailable = results.length;
    const from = (page - 1) * PAGE_SIZE;
    results = results.slice(from, from + PAGE_SIZE);
  }

  const typeMeta = {
    tool: { label: "Tool", icon: Wrench, color: "bg-brand-50 text-brand-700" },
    article: { label: "Artikel", icon: FileText, color: "bg-accent-50 text-accent-700" },
    community: { label: "Komunitas", icon: Users, color: "bg-emerald-50 text-emerald-700" },
    post: { label: "Diskusi", icon: MessageSquare, color: "bg-amber-50 text-amber-700" },
  } as const;

  const totalPages = Math.ceil(totalAvailable / PAGE_SIZE);

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
              Ketik minimal 2 karakter untuk mencari tools, artikel, komunitas, dan diskusi.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["json", "pdf", "qr code", "password", "kalkulator"].map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="rounded-full border border-slate-200 bg-surface px-4 py-1.5 text-sm font-medium text-ink-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm active:translate-y-0 active:scale-95"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="mt-8 text-sm text-ink-secondary" aria-live="polite">
              <strong className="text-ink">{totalAvailable}</strong> hasil untuk{" "}
              <strong className="text-ink">“{query}”</strong>
            </p>
            <ul className="mt-4 space-y-3">
              {results.map((result, i) => {
                const meta = typeMeta[result.type];
                return (
                  <li
                    key={`${result.href}-${i}`}
                    style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
                    className="animate-slide-up-far"
                  >
                    <Card className="p-4 transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
                      <Link href={result.href} className="flex items-start gap-3.5">
                        <span
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out-expo group-hover:scale-110 ${meta.color}`}
                        >
                          <meta.icon className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-muted">
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

            {totalPages > 1 ? (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalPages} basePath="/search" query={{ q: query }} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-center animate-slide-up-far">
            <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted animate-pop-in">
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
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
