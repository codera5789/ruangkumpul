import { cache } from "react";
import { withFailSoft } from "@/lib/supabase/query";
import { postgrestIlikePattern } from "@/lib/utils";
import type { Enums, Tables } from "@/types/database";
import type { MarketplaceSort } from "@/modules/marketplace/constants";

export type MarketplaceCategory = Tables<"marketplace_categories">;

export type ProductWithSeller = Tables<"marketplace_products"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
  marketplace_categories: Pick<Tables<"marketplace_categories">, "id" | "slug" | "name"> | null;
};

export type InquiryWithProduct = Tables<"product_inquiries"> & {
  marketplace_products: Pick<Tables<"marketplace_products">, "id" | "title" | "slug"> | null;
};

const PRODUCT_SELECT = `*,
  profiles (username, full_name, avatar_url),
  marketplace_categories (id, slug, name)`;

/** Daftar kategori marketplace terurut. */
export const listMarketplaceCategories = cache(async (): Promise<MarketplaceCategory[]> => {
  return withFailSoft("[marketplace] listMarketplaceCategories gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as MarketplaceCategory[];
  });
});

/** Katalog produk published dengan pagination, filter, pencarian, dan pengurutan. */
export async function listPublishedProductsPaginated({
  page = 1,
  pageSize = 12,
  categoryId,
  productType,
  search,
  sort = "newest",
}: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  productType?: Enums["marketplace_product_type"];
  search?: string;
  sort?: MarketplaceSort;
}): Promise<{ products: ProductWithSeller[]; total: number }> {
  return withFailSoft(
    "[marketplace] listPublishedProductsPaginated gagal:",
    { products: [], total: 0 },
    async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("marketplace_products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status", "published");

    if (categoryId) query = query.eq("category_id", categoryId);
    if (productType) query = query.eq("product_type", productType);

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      const pattern = postgrestIlikePattern(trimmedSearch);
      query = query.or(`title.ilike.${pattern},summary.ilike.${pattern}`);
    }

    switch (sort) {
      case "price_asc":
        query = query.order("price_idr", { ascending: true }).order("created_at", { ascending: false });
        break;
      case "price_desc":
        query = query.order("price_idr", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "popular":
        query = query.order("inquiry_count", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);

    if (error) throw error;
    return { products: (data ?? []) as ProductWithSeller[], total: count ?? 0 };
  });
}

/** Inti bersama getter produk: lookup satu kolom dengan fail-soft. */
async function getProductByColumn(
  column: "slug" | "id",
  value: string,
): Promise<ProductWithSeller | null> {
  return withFailSoft(`[marketplace] getProductBy(${column}) gagal:`, null, async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("marketplace_products")
      .select(PRODUCT_SELECT)
      .eq(column, value)
      .single();

    if (error || !data) return null;
    return data as ProductWithSeller;
  });
}

/** Detail produk berdasarkan slug, di-cache per request. */
export const getProductBySlug = cache(async (slug: string): Promise<ProductWithSeller | null> =>
  getProductByColumn("slug", slug),
);

/** Detail produk berdasarkan ID, di-cache per request. */
export const getProductById = cache(async (id: string): Promise<ProductWithSeller | null> =>
  getProductByColumn("id", id),
);

/** Daftar produk milik kreator tertentu (termasuk draft & arsip). */
export async function listSellerProducts(sellerId: string): Promise<ProductWithSeller[]> {
  return withFailSoft("[marketplace] listSellerProducts gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("marketplace_products")
      .select(PRODUCT_SELECT)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ProductWithSeller[];
  });
}

/** Daftar inquiry masuk untuk produk milik penjual. */
export async function listSellerInquiries(sellerId: string): Promise<InquiryWithProduct[]> {
  return withFailSoft("[marketplace] listSellerInquiries gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_inquiries")
      .select(`*, marketplace_products (id, title, slug)`)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data ?? []) as InquiryWithProduct[];
  });
}
