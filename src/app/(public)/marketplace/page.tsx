import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Store } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { siteConfig } from "@/config/site";
import { parsePageParam } from "@/lib/form";
import { cn, toJsonLd } from "@/lib/utils";
import { ProductCard } from "@/modules/marketplace/components/product-card";
import {
  MARKETPLACE_SORT_OPTIONS,
  PRODUCT_TYPE_LABELS,
  type MarketplaceSort,
} from "@/modules/marketplace/constants";
import {
  listMarketplaceCategories,
  listPublishedProductsPaginated,
} from "@/modules/marketplace/services";
import type { Enums } from "@/types/database";

export const metadata: Metadata = {
  title: "Ruang Marketplace · Produk Digital, Template Kode, dan Jasa Freelance",
  description:
    "Temukan template kode, modul UI, aset digital, dan jasa freelance dari kreator komunitas RuangKumpul.",
  keywords: ["marketplace digital indonesia", "template nextjs", "modul ui", "jasa freelance"],
  alternates: { canonical: "/marketplace" },
};

const PAGE_SIZE = 12;
type ProductType = Enums["marketplace_product_type"];

const TYPE_FILTERS: { value: ProductType | ""; label: string }[] = [
  { value: "", label: "Semua Tipe" },
  ...(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

function isProductType(v: string | undefined): v is ProductType {
  return !!v && v in PRODUCT_TYPE_LABELS;
}

function isSortOption(v: string | undefined): v is MarketplaceSort {
  return MARKETPLACE_SORT_OPTIONS.some((opt) => opt.value === v);
}

function buildMarketplaceHref(params: {
  kategori?: string;
  tipe?: string;
  q?: string;
  urut?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.kategori) sp.set("kategori", params.kategori);
  if (params.tipe) sp.set("tipe", params.tipe);
  if (params.q) sp.set("q", params.q);
  if (params.urut && params.urut !== "newest") sp.set("urut", params.urut);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

async function MarketplaceContent({
  searchParams,
}: {
  searchParams: Promise<{
    kategori?: string;
    tipe?: string;
    q?: string;
    urut?: string;
    page?: string;
  }>;
}) {
  const { kategori, tipe, q, urut, page: pageParam } = await searchParams;
  const productType = isProductType(tipe) ? tipe : undefined;
  const sort: MarketplaceSort = isSortOption(urut) ? urut : "newest";
  const search = q?.trim() || undefined;
  const page = parsePageParam(pageParam);

  const categories = await listMarketplaceCategories();
  const activeCategory = categories.find((c) => c.slug === kategori);

  const { products, total } = await listPublishedProductsPaginated({
    page,
    pageSize: PAGE_SIZE,
    categoryId: activeCategory?.id,
    productType,
    search,
    sort,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RuangKumpul Marketplace",
    url: `${siteConfig.url}/marketplace`,
  };

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />

      <PageHero
        eyebrow="Ruang Marketplace"
        title="Karya digital & jasa komunitas."
        description="Template kode, modul UI, aset digital, dan layanan freelance terkurasi dari kreator Indonesia."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50"
          >
            <Link href="/marketplace/buat">
              <Plus className="size-5" aria-hidden="true" />
              Tambah Produk
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/dashboard/marketplace">Kelola Listing</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="marketplace-list">
        <h2 id="marketplace-list" className="sr-only">
          Katalog Ruang Marketplace
        </h2>

        {/* Pencarian & pengurutan */}
        <form
          action="/marketplace"
          method="get"
          className="mb-6 flex flex-col gap-3 rounded-card border border-slate-200/80 bg-surface p-4 shadow-card sm:flex-row sm:items-center"
        >
          {activeCategory ? (
            <input type="hidden" name="kategori" value={activeCategory.slug} />
          ) : null}
          {productType ? <input type="hidden" name="tipe" value={productType} /> : null}

          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={search ?? ""}
              placeholder="Cari template, modul UI, atau jasa freelance..."
              aria-label="Cari produk marketplace"
              className="min-h-11 w-full rounded-control border border-slate-200 bg-surface-muted pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              name="urut"
              defaultValue={sort}
              aria-label="Urutkan produk"
              className="min-h-11 rounded-control border border-slate-200 bg-surface px-3.5 text-sm text-ink focus:outline-hidden"
            >
              {MARKETPLACE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button type="submit" size="md">
              Terapkan
            </Button>
          </div>
        </form>

        {/* Filter kategori */}
        {categories.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <Link
              href={buildMarketplaceHref({ tipe: productType, q: search, urut: sort })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                !activeCategory
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-brand-800",
              )}
            >
              Semua Kategori
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildMarketplaceHref({
                  kategori: cat.slug,
                  tipe: productType,
                  q: search,
                  urut: sort,
                })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                  activeCategory?.id === cat.id
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-brand-800",
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Filter tipe produk */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={buildMarketplaceHref({
                kategori: activeCategory?.slug,
                tipe: f.value || undefined,
                q: search,
                urut: sort,
              })}
              className={cn(
                "rounded-full border px-3.5 py-1 text-xs font-semibold transition-all duration-200",
                (productType ?? "") === f.value
                  ? "border-accent-600 bg-accent-600 text-white"
                  : "border-slate-200 bg-surface text-ink-secondary hover:border-accent-500 hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  className="animate-slide-up-far"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/marketplace"
                query={{
                  ...(activeCategory ? { kategori: activeCategory.slug } : {}),
                  ...(productType ? { tipe: productType } : {}),
                  ...(search ? { q: search } : {}),
                  ...(sort !== "newest" ? { urut: sort } : {}),
                }}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Store}
            title="Belum ada produk yang sesuai"
            description="Coba ubah kata kunci atau filter kategori, atau jadilah kreator pertama yang menayangkan produk di sini."
            action={
              <Button asChild>
                <Link href="/marketplace/buat">Tambah Produk Sekarang</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

export default function MarketplacePage(props: {
  searchParams: Promise<{
    kategori?: string;
    tipe?: string;
    q?: string;
    urut?: string;
    page?: string;
  }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MarketplaceContent searchParams={props.searchParams} />
    </Suspense>
  );
}
