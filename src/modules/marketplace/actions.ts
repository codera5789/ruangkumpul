"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { zodFieldErrors, type ActionState } from "@/lib/form";
import { enforceRateLimit } from "@/lib/rate-limit";
import { uniqueSlug } from "@/lib/utils";
import {
  createInquirySchema,
  createProductSchema,
  parseTagsInput,
  updateInquiryStatusSchema,
  updateProductSchema,
} from "@/modules/marketplace/schemas";

export type MarketplaceActionState = ActionState;

function extractProductFields(formData: FormData) {
  return {
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || "",
    productType: formData.get("productType") || "template",
    priceIdr: formData.get("priceIdr") ?? 0,
    licenseType: formData.get("licenseType") || "personal",
    previewUrl: formData.get("previewUrl") || "",
    demoUrl: formData.get("demoUrl") || "",
    tagsRaw: formData.get("tagsRaw") || "",
    status: formData.get("status") || "published",
  };
}

export async function actionCreateProduct(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const parsed = createProductSchema.safeParse(extractProductFields(formData));
  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "Kamu harus masuk untuk menambahkan produk.", success: null };
  }

  try {
    await enforceRateLimit(`marketplace-create:${user.id}`, 8, 3600);
  } catch {
    return { error: "Batas pembuatan produk tercapai. Coba lagi nanti.", success: null };
  }

  const slug = uniqueSlug(parsed.data.title, "produk", 180);

  const { data: product, error } = await supabase
    .from("marketplace_products")
    .insert({
      seller_id: user.id,
      category_id: parsed.data.categoryId || null,
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      description: parsed.data.description,
      product_type: parsed.data.productType,
      price_idr: parsed.data.priceIdr,
      license_type: parsed.data.licenseType,
      preview_url: parsed.data.previewUrl || null,
      demo_url: parsed.data.demoUrl || null,
      tags: parseTagsInput(parsed.data.tagsRaw),
      status: parsed.data.status,
    })
    .select("slug")
    .single();

  if (error || !product) {
    console.error("[marketplace] gagal membuat produk:", error?.message);
    return { error: "Gagal menyimpan produk. Coba lagi.", success: null };
  }

  revalidatePath("/marketplace");
  revalidatePath("/dashboard/marketplace");
  redirect(`/marketplace/${product.slug}`);
}

export async function actionUpdateProduct(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const parsed = updateProductSchema.safeParse({
    ...extractProductFields(formData),
    productId: formData.get("productId"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "Kamu harus masuk untuk menyunting produk.", success: null };
  }

  const { data: product, error } = await supabase
    .from("marketplace_products")
    .update({
      category_id: parsed.data.categoryId || null,
      title: parsed.data.title,
      summary: parsed.data.summary,
      description: parsed.data.description,
      product_type: parsed.data.productType,
      price_idr: parsed.data.priceIdr,
      license_type: parsed.data.licenseType,
      preview_url: parsed.data.previewUrl || null,
      demo_url: parsed.data.demoUrl || null,
      tags: parseTagsInput(parsed.data.tagsRaw),
      status: parsed.data.status,
    })
    .eq("id", parsed.data.productId)
    .select("slug")
    .single();

  if (error || !product) {
    console.error("[marketplace] gagal memperbarui produk:", error?.message);
    return { error: "Gagal memperbarui produk atau akses ditolak.", success: null };
  }

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${product.slug}`);
  revalidatePath("/dashboard/marketplace");
  return { error: null, success: "Perubahan produk berhasil disimpan." };
}

export async function actionUpdateProductStatus(formData: FormData): Promise<void> {
  const productSlug = String(formData.get("productSlug") || "");
  const nextStatus = String(formData.get("status") || "");
  if (!productSlug || !["draft", "published", "archived"].includes(nextStatus)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("marketplace_products")
    .update({ status: nextStatus as "draft" | "published" | "archived" })
    .eq("slug", productSlug);

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${productSlug}`);
  revalidatePath("/dashboard/marketplace");
}

export async function actionCreateInquiry(
  _prev: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const parsed = createInquirySchema.safeParse({
    productId: formData.get("productId"),
    buyerName: formData.get("buyerName"),
    buyerContact: formData.get("buyerContact"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "Kamu harus masuk terlebih dahulu untuk menghubungi kreator.", success: null };
  }

  try {
    await enforceRateLimit(`marketplace-inquiry:${user.id}`, 10, 3600);
  } catch {
    return { error: "Batas pengiriman pesan tercapai. Coba lagi nanti.", success: null };
  }

  const { data: product } = await supabase
    .from("marketplace_products")
    .select("id, seller_id, slug, status")
    .eq("id", parsed.data.productId)
    .single();

  if (!product || product.status !== "published") {
    return { error: "Produk tidak ditemukan atau tidak tersedia.", success: null };
  }

  if (product.seller_id === user.id) {
    return { error: "Kamu tidak dapat mengirim inquiry ke produk milik sendiri.", success: null };
  }

  const { error } = await supabase.from("product_inquiries").insert({
    product_id: product.id,
    buyer_id: user.id,
    seller_id: product.seller_id,
    buyer_name: parsed.data.buyerName,
    buyer_contact: parsed.data.buyerContact,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    console.error("[marketplace] gagal mengirim inquiry:", error.message);
    return { error: "Gagal mengirim pesan. Coba lagi.", success: null };
  }

  revalidatePath(`/marketplace/${product.slug}`);
  revalidatePath("/dashboard/marketplace");
  return {
    error: null,
    success: "Pesan inquiry berhasil dikirim ke kreator.",
  };
}

export async function actionUpdateInquiryStatus(formData: FormData): Promise<void> {
  const parsed = updateInquiryStatusSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("product_inquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.inquiryId);

  revalidatePath("/dashboard/marketplace");
}
