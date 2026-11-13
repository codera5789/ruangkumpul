import type { Enums } from "@/types/database";

export const PRODUCT_TYPE_LABELS: Record<Enums["marketplace_product_type"], string> = {
  template: "Template Kode",
  source_code: "Source Code",
  ui_kit: "Modul UI",
  digital_asset: "Aset Digital",
  freelance_service: "Jasa Freelance",
};

export const LICENSE_TYPE_LABELS: Record<Enums["marketplace_license_type"], string> = {
  free: "Gratis",
  personal: "Lisensi Personal",
  commercial: "Lisensi Komersial",
  open_source: "Open Source",
};

export const PRODUCT_STATUS_LABELS: Record<Enums["marketplace_product_status"], string> = {
  draft: "Draf",
  published: "Tayang",
  archived: "Diarsipkan",
};

export const INQUIRY_STATUS_LABELS: Record<Enums["marketplace_inquiry_status"], string> = {
  new: "Baru",
  replied: "Dibalas",
  closed: "Selesai",
};

export const MARKETPLACE_SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Paling Diminati" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
] as const;

export type MarketplaceSort = (typeof MARKETPLACE_SORT_OPTIONS)[number]["value"];

/** Format harga rupiah atau label gratis jika bernilai nol. */
export function formatPriceIdr(priceIdr: number): string {
  if (!Number.isFinite(priceIdr) || priceIdr <= 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(priceIdr);
}
