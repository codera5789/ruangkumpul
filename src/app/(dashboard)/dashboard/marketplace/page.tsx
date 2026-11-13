import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { formatDateId } from "@/lib/utils";
import {
  actionUpdateInquiryStatus,
  actionUpdateProductStatus,
} from "@/modules/marketplace/actions";
import {
  formatPriceIdr,
  INQUIRY_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/modules/marketplace/constants";
import { listSellerInquiries, listSellerProducts } from "@/modules/marketplace/services";

export const metadata: Metadata = {
  title: "Kelola Marketplace · Dashboard",
};

async function DashboardMarketplaceContent() {
  const { user } = await requireUser();
  if (!user) redirect("/login?next=/dashboard/marketplace");

  const [products, inquiries] = await Promise.all([
    listSellerProducts(user.id),
    listSellerInquiries(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Ruang Marketplace Saya
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Kelola listing produk digital, jasa freelance, serta pesan inquiry dari calon pembeli.
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace/buat">
            <Plus className="size-4" aria-hidden="true" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Daftar produk milik pengguna */}
      <section className="space-y-4" aria-labelledby="my-products-heading">
        <h2 id="my-products-heading" className="text-lg font-bold text-ink">
          Listing Produk ({products.length})
        </h2>

        {products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col justify-between gap-4 rounded-card border border-slate-200/80 bg-surface p-4 shadow-card sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/marketplace/${product.slug}`}
                      className="font-bold text-ink hover:text-brand-800"
                    >
                      {product.title}
                    </Link>
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-secondary">
                      {PRODUCT_TYPE_LABELS[product.product_type]}
                    </span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {formatPriceIdr(product.price_idr)} · {product.inquiry_count} inquiry ·{" "}
                    {formatDateId(product.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/marketplace/${product.slug}`}>Lihat</Link>
                  </Button>
                  {product.status === "published" ? (
                    <form action={actionUpdateProductStatus}>
                      <input type="hidden" name="productSlug" value={product.slug} />
                      <input type="hidden" name="status" value="archived" />
                      <Button type="submit" variant="ghost" size="sm">
                        Arsipkan
                      </Button>
                    </form>
                  ) : (
                    <form action={actionUpdateProductStatus}>
                      <input type="hidden" name="productSlug" value={product.slug} />
                      <input type="hidden" name="status" value="published" />
                      <Button type="submit" variant="ghost" size="sm">
                        Tayangkan
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title="Belum ada produk"
            description="Kamu belum menerbitkan produk atau jasa apa pun di Ruang Marketplace."
            action={
              <Button asChild>
                <Link href="/marketplace/buat">Buat Listing Pertama</Link>
              </Button>
            }
          />
        )}
      </section>

      {/* Daftar inquiry masuk */}
      <section className="space-y-4" aria-labelledby="inquiries-heading">
        <h2 id="inquiries-heading" className="text-lg font-bold text-ink">
          Inquiry Masuk ({inquiries.length})
        </h2>

        {inquiries.length > 0 ? (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="rounded-card border border-slate-200/80 bg-surface p-4 shadow-card space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {inq.buyer_name}{" "}
                      <span className="font-normal text-ink-secondary">
                        ({inq.buyer_contact})
                      </span>
                    </p>
                    {inq.marketplace_products ? (
                      <Link
                        href={`/marketplace/${inq.marketplace_products.slug}`}
                        className="text-xs font-semibold text-brand-800 hover:underline"
                      >
                        Produk: {inq.marketplace_products.title}
                      </Link>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-secondary">
                    {INQUIRY_STATUS_LABELS[inq.status]}
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
                  {inq.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                  <span className="text-xs text-ink-muted">{formatDateId(inq.created_at)}</span>
                  <div className="flex flex-wrap gap-2">
                    {inq.status !== "replied" ? (
                      <form action={actionUpdateInquiryStatus}>
                        <input type="hidden" name="inquiryId" value={inq.id} />
                        <input type="hidden" name="status" value="replied" />
                        <Button type="submit" variant="outline" size="sm">
                          Tandai Dibalas
                        </Button>
                      </form>
                    ) : null}
                    {inq.status !== "closed" ? (
                      <form action={actionUpdateInquiryStatus}>
                        <input type="hidden" name="inquiryId" value={inq.id} />
                        <input type="hidden" name="status" value="closed" />
                        <Button type="submit" variant="ghost" size="sm">
                          Tutup
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Belum ada inquiry yang masuk untuk produk kamu.
          </p>
        )}
      </section>
    </div>
  );
}

export default function DashboardMarketplacePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardMarketplaceContent />
    </Suspense>
  );
}
