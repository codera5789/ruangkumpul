import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Package,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, toJsonLd } from "@/lib/utils";
import { actionUpdateProductStatus } from "@/modules/marketplace/actions";
import { InquiryForm } from "@/modules/marketplace/components/inquiry-form";
import {
  formatPriceIdr,
  LICENSE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/modules/marketplace/constants";
import { getProductBySlug } from "@/modules/marketplace/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };

  return {
    title: `${product.title} · Ruang Marketplace`,
    description: product.summary,
    alternates: { canonical: `/marketplace/${product.slug}` },
  };
}

async function MarketplaceDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSeller = user?.id === product.seller_id;
  const sellerName = product.profiles?.full_name || product.profiles?.username || "Kreator";

  let buyerDisplayName = "";
  if (user && !isSeller) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();
    buyerDisplayName = profile?.full_name || profile?.username || "";
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary,
    url: `${siteConfig.url}/marketplace/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: String(product.price_idr),
      priceCurrency: "IDR",
      availability:
        product.status === "published"
          ? "https://schema.org/InStock"
          : "https://schema.org/Discontinued",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(productJsonLd) }}
      />

      <Link
        href="/marketplace"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke Ruang Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Konten utama produk */}
        <article className="space-y-6 lg:col-span-2">
          <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                <Package className="size-3.5" aria-hidden="true" />
                {PRODUCT_TYPE_LABELS[product.product_type]}
              </span>
              {product.marketplace_categories ? (
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary">
                  {product.marketplace_categories.name}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {LICENSE_TYPE_LABELS[product.license_type]}
              </span>
              {product.status !== "published" ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {PRODUCT_STATUS_LABELS[product.status]}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-secondary">
              {product.summary}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {product.demo_url ? (
                <Button asChild size="md">
                  <a href={product.demo_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Lihat Demo
                  </a>
                </Button>
              ) : null}
              {product.preview_url ? (
                <Button asChild variant="outline" size="md">
                  <a href={product.preview_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Pratinjau / Dokumentasi
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card">
            <h2 className="mb-3 text-lg font-bold text-ink">Deskripsi Produk</h2>
            <div className="max-w-prose whitespace-pre-wrap text-base leading-relaxed text-ink-secondary">
              {product.description}
            </div>

            {product.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-secondary"
                  >
                    <Tag className="size-3 text-ink-muted" aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        {/* Sidebar harga, kreator, dan inquiry */}
        <aside className="space-y-5">
          <div className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold text-ink-muted">Harga</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">
              {formatPriceIdr(product.price_idr)}
            </p>

            <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-4 text-sm text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Kreator</span>
                {product.profiles?.username ? (
                  <Link
                    href={`/pengguna/${product.profiles.username}`}
                    className="font-semibold text-brand-800 hover:underline"
                  >
                    {sellerName}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{sellerName}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Lisensi</span>
                <span className="font-medium text-ink">
                  {LICENSE_TYPE_LABELS[product.license_type]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Dipublikasikan</span>
                <span>{formatDateId(product.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Inquiry</span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-3.5 text-ink-muted" aria-hidden="true" />
                  {product.inquiry_count}
                </span>
              </div>
            </div>
          </div>

          {isSeller ? (
            <div className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card space-y-3">
              <h2 className="text-base font-bold text-ink">Kelola Produk Kamu</h2>
              <p className="text-sm text-ink-secondary">
                Pantau pesan inquiry masuk atau perbarui status tayang produk dari dashboard.
              </p>
              <Button asChild className="w-full">
                <Link href={`/dashboard/marketplace/${product.id}/edit`}>Sunting Produk</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/marketplace">Buka Dashboard Marketplace</Link>
              </Button>
              {product.status === "published" ? (
                <form action={actionUpdateProductStatus}>
                  <input type="hidden" name="productSlug" value={product.slug} />
                  <input type="hidden" name="status" value="archived" />
                  <Button type="submit" variant="outline" className="w-full">
                    Arsipkan Produk
                  </Button>
                </form>
              ) : (
                <form action={actionUpdateProductStatus}>
                  <input type="hidden" name="productSlug" value={product.slug} />
                  <input type="hidden" name="status" value="published" />
                  <Button type="submit" variant="outline" className="w-full">
                    Tayangkan Kembali
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card">
              <h2 className="mb-1 text-base font-bold text-ink">Hubungi Kreator</h2>
              <p className="mb-4 text-xs leading-relaxed text-ink-secondary">
                Kirim pertanyaan pemesanan, kustomisasi, atau lisensi langsung ke kreator.
              </p>

              {user ? (
                product.status === "published" ? (
                  <InquiryForm productId={product.id} defaultName={buyerDisplayName} />
                ) : (
                  <p className="text-sm text-ink-muted">
                    Produk ini sedang tidak menerima inquiry baru.
                  </p>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-ink-secondary">
                    Masuk ke akun RuangKumpul untuk mengirim pesan inquiry ke kreator.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/login?next=/marketplace/${product.slug}`}>
                      Masuk untuk Menghubungi
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function MarketplaceDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MarketplaceDetailContent params={props.params} />
    </Suspense>
  );
}
