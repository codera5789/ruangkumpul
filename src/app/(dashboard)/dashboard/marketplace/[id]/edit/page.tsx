import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { requireUser } from "@/lib/auth";
import { ProductForm } from "@/modules/marketplace/components/product-form";
import { getProductById, listMarketplaceCategories } from "@/modules/marketplace/services";

export const metadata: Metadata = {
  title: "Sunting Produk · Dashboard Marketplace",
};

async function EditMarketplaceProductContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { user } = await requireUser();
  if (!user) redirect(`/login?next=/dashboard/marketplace/${id}/edit`);

  const [product, categories] = await Promise.all([
    getProductById(id),
    listMarketplaceCategories(),
  ]);

  if (!product || product.seller_id !== user.id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/marketplace"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke Marketplace Saya
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Sunting Produk
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Perbarui informasi produk, harga, lisensi, atau status tayang.
        </p>
      </div>

      <ProductForm categories={categories} initialProduct={product} />
    </div>
  );
}

export default function EditMarketplaceProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditMarketplaceProductContent params={params} />
    </Suspense>
  );
}
