"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import {
  actionCreateProduct,
  actionUpdateProduct,
  type MarketplaceActionState,
} from "@/modules/marketplace/actions";
import {
  LICENSE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/modules/marketplace/constants";
import type { MarketplaceCategory, ProductWithSeller } from "@/modules/marketplace/services";

const initialState: MarketplaceActionState = { error: null, success: null };

/** Form buat atau sunting listing produk Ruang Marketplace. */
export function ProductForm({
  categories,
  initialProduct,
}: {
  categories: MarketplaceCategory[];
  initialProduct?: ProductWithSeller;
}) {
  const isEdit = Boolean(initialProduct);
  const action = isEdit ? actionUpdateProduct : actionCreateProduct;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {initialProduct ? (
        <input type="hidden" name="productId" value={initialProduct.id} />
      ) : null}

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ink">
              Judul produk atau jasa *
            </label>
            <Input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={200}
              defaultValue={initialProduct?.title ?? ""}
              placeholder="mis. Starter Kit SaaS Next.js + Supabase"
              error={state.fieldErrors?.title}
            />
          </div>

          <div>
            <label htmlFor="summary" className="mb-1.5 block text-sm font-semibold text-ink">
              Ringkasan singkat *
            </label>
            <Input
              id="summary"
              name="summary"
              required
              minLength={10}
              maxLength={300}
              defaultValue={initialProduct?.summary ?? ""}
              placeholder="Ringkasan nilai utama produk dalam satu hingga dua kalimat."
              error={state.fieldErrors?.summary}
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-ink">
              Deskripsi lengkap * <span className="font-normal text-ink-muted">(fitur, stack, cara pakai, cakupan jasa)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              required
              rows={10}
              minLength={30}
              maxLength={10000}
              defaultValue={initialProduct?.description ?? ""}
              placeholder="Jelaskan detail produk digital atau layanan yang kamu tawarkan..."
              error={state.fieldErrors?.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="previewUrl" className="mb-1.5 block text-sm font-semibold text-ink">
                URL pratinjau / dokumentasi
              </label>
              <Input
                id="previewUrl"
                name="previewUrl"
                type="url"
                defaultValue={initialProduct?.preview_url ?? ""}
                placeholder="https://github.com/..."
                error={state.fieldErrors?.previewUrl}
              />
            </div>
            <div>
              <label htmlFor="demoUrl" className="mb-1.5 block text-sm font-semibold text-ink">
                URL demo langsung
              </label>
              <Input
                id="demoUrl"
                name="demoUrl"
                type="url"
                defaultValue={initialProduct?.demo_url ?? ""}
                placeholder="https://demo.produk.id"
                error={state.fieldErrors?.demoUrl}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tagsRaw" className="mb-1.5 block text-sm font-semibold text-ink">
              Tag <span className="font-normal text-ink-muted">(pisahkan dengan koma, maksimal 8 tag)</span>
            </label>
            <Input
              id="tagsRaw"
              name="tagsRaw"
              maxLength={300}
              defaultValue={initialProduct?.tags.join(", ") ?? ""}
              placeholder="nextjs, tailwind, supabase, ui-kit"
              error={state.fieldErrors?.tagsRaw}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-slate-200/80 bg-surface p-4 space-y-3">
            <div>
              <label htmlFor="categoryId" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Kategori
              </label>
              <Select
                id="categoryId"
                name="categoryId"
                defaultValue={initialProduct?.category_id ?? ""}
                error={state.fieldErrors?.categoryId}
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="productType" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Tipe produk *
              </label>
              <Select
                id="productType"
                name="productType"
                defaultValue={initialProduct?.product_type ?? "template"}
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="licenseType" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Lisensi *
              </label>
              <Select
                id="licenseType"
                name="licenseType"
                defaultValue={initialProduct?.license_type ?? "personal"}
              >
                {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="priceIdr" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Harga (IDR) * <span className="font-normal text-ink-muted">(isi 0 untuk gratis)</span>
              </label>
              <Input
                id="priceIdr"
                name="priceIdr"
                type="number"
                min={0}
                required
                defaultValue={initialProduct?.price_idr ?? 0}
                error={state.fieldErrors?.priceIdr}
              />
            </div>

            <div>
              <label htmlFor="status" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Status tayang *
              </label>
              <Select
                id="status"
                name="status"
                defaultValue={initialProduct?.status ?? "published"}
              >
                <option value="published">{PRODUCT_STATUS_LABELS.published}</option>
                <option value="draft">{PRODUCT_STATUS_LABELS.draft}</option>
                {isEdit ? (
                  <option value="archived">{PRODUCT_STATUS_LABELS.archived}</option>
                ) : null}
              </Select>
            </div>
          </div>

          <SubmitButton
            pendingText={isEdit ? "Menyimpan..." : "Menerbitkan..."}
            className="w-full"
          >
            {isEdit ? "Simpan Perubahan" : "Terbitkan Produk"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
