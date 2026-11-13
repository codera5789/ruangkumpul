import Link from "next/link";
import { MessageSquare, Package, ShieldCheck, Tag } from "lucide-react";
import { timeAgoId } from "@/lib/utils";
import {
  formatPriceIdr,
  LICENSE_TYPE_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/modules/marketplace/constants";
import type { ProductWithSeller } from "@/modules/marketplace/services";

/** Kartu produk digital atau jasa untuk katalog Ruang Marketplace. */
export function ProductCard({ product }: { product: ProductWithSeller }) {
  const sellerName = product.profiles?.full_name || product.profiles?.username || "Kreator";
  const isFree = product.price_idr <= 0;

  return (
    <Link
      href={`/marketplace/${product.slug}`}
      className="group flex flex-col gap-3 rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">
          <Package className="size-3.5" aria-hidden="true" />
          {PRODUCT_TYPE_LABELS[product.product_type]}
        </span>
        {product.marketplace_categories ? (
          <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-secondary">
            {product.marketplace_categories.name}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-ink-muted">{timeAgoId(product.created_at)}</span>
      </div>

      <div>
        <h3 className="line-clamp-1 font-bold text-ink group-hover:text-brand-800">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {product.summary}
        </p>
      </div>

      {product.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary"
            >
              <Tag className="size-3 text-ink-muted" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
        <div className="flex flex-col">
          <span className={isFree ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-ink"}>
            {formatPriceIdr(product.price_idr)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {LICENSE_TYPE_LABELS[product.license_type]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-secondary">
          <span>oleh {sellerName}</span>
          {product.inquiry_count > 0 ? (
            <span className="inline-flex items-center gap-1 text-ink-muted" title="Jumlah inquiry">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              {product.inquiry_count}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
