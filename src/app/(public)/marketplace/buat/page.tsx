import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ProductForm } from "@/modules/marketplace/components/product-form";
import { listMarketplaceCategories } from "@/modules/marketplace/services";

export const metadata: Metadata = {
  title: "Tambah Produk · Ruang Marketplace",
  description: "Terbitkan template kode, modul UI, aset digital, atau jasa freelance ke RuangKumpul.",
};

export default async function CreateMarketplaceProductPage() {
  const { user } = await requireUser();
  if (!user) redirect("/login?next=/marketplace/buat");

  const categories = await listMarketplaceCategories();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/marketplace"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke Ruang Marketplace
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Tambah Produk atau Jasa
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Bagikan template kode, modul UI, aset digital, atau layanan freelance ke komunitas RuangKumpul.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
