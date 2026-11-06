import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { listArticleCategories } from "@/modules/knowledge/services";
import { listPublishedArticles } from "@/modules/knowledge/services";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Artikel & Tutorial — Belajar Bersama di RuangKumpul",
  description:
    "Kumpulan artikel dan tutorial pilihan: teknologi, produktivitas, bisnis digital, dan tips internet. Gratis dibaca, ditulis oleh kontributor RuangKumpul.",
  keywords: ["artikel indonesia", "tutorial gratis", "belajar online"],
  alternates: { canonical: "/artikel" },
};

const PAGE_SIZE = 9;

async function ArtikelContent({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; page?: string }>;
}) {
  const { kategori, page: pageParam } = await searchParams;
  const page = Math.max(1, Math.min(100, Number(pageParam) || 1));

  const [categories, result] = await Promise.all([
    listArticleCategories(),
    listPublishedArticles({ kategoriSlug: kategori, page, pageSize: PAGE_SIZE }),
  ]);

  const { articles, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (kategori) params.set("kategori", kategori);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/artikel${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-brand-800 to-accent-600">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold text-brand-200">Ruang Pengetahuan</p>
          <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Artikel &amp; tutorial pilihan.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-brand-100">
            Belajar hal baru setiap hari — dari tips produktivitas hingga
            panduan teknologi, semuanya gratis.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Filter kategori */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/artikel"
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              !kategori
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-brand-800",
            )}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/artikel?kategori=${cat.slug}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                kategori === cat.slug
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-brand-800",
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {articles.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <nav
                aria-label="Navigasi halaman"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-semibold text-ink-secondary hover:border-brand-300 hover:text-brand-800"
                  >
                    ← Sebelumnya
                  </Link>
                ) : null}
                <span className="px-3 text-sm text-ink-secondary">
                  Halaman {page} dari {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-semibold text-ink-secondary hover:border-brand-300 hover:text-brand-800"
                  >
                    Selanjutnya →
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={PenLine}
            title={kategori ? "Belum ada artikel di kategori ini" : "Belum ada artikel"}
            description="Konten sedang disiapkan oleh tim dan kontributor kami. Nantikan artikel menarik dalam waktu dekat."
            action={
              <Link
                href="/artikel"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Lihat semua artikel
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

export default function ArtikelPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ArtikelContent searchParams={searchParams} />
    </Suspense>
  );
}
