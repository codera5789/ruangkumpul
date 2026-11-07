import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { listArticleCategories, listPublishedArticles } from "@/modules/knowledge/services";
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

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-accent-600">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-16 size-72 rounded-full bg-accent-400/25 blur-3xl animate-float" />
          <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-brand-300/20 blur-3xl animate-float [animation-delay:-3.5s]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="animate-slide-up-far">
            <p className="text-sm font-semibold text-brand-200">Ruang Pengetahuan</p>
            <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Artikel &amp; tutorial pilihan.
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-brand-100">
              Belajar hal baru setiap hari — dari tips produktivitas hingga
              panduan teknologi, semuanya gratis.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Filter kategori */}
        <div className="mb-8 flex flex-wrap gap-2 animate-fade-in">
          <Link
            href="/artikel"
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95",
              !kategori
                ? "border-brand-800 bg-brand-800 text-white shadow-sm shadow-brand-900/20"
                : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm",
            )}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/artikel?kategori=${cat.slug}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95",
                kategori === cat.slug
                  ? "border-brand-800 bg-brand-800 text-white shadow-sm shadow-brand-900/20"
                  : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm",
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {articles.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, i) => (
                <div
                  key={article.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                  className="animate-slide-up-far"
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/artikel"
                query={kategori ? { kategori } : undefined}
                className="mt-10"
              />
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
