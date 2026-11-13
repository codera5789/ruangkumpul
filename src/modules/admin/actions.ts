"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isUuid, type ActionState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeAnnouncementHref,
  PLATFORM_ANNOUNCEMENT_KEY,
} from "@/modules/admin/settings";
import type { Enums, Json } from "@/types/database";

export type AdminActionState = ActionState;

/** Pastikan pengguna saat ini adalah admin/super_admin (dicek via RLS function). */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return null;

  return user;
}

/**
 * Semua operasi admin di modul ini berjalan lewat client biasa + RLS
 * (policy is_admin tersedia di setiap tabel admin) — tidak butuh service role.
 */
async function getAdminDb() {
  return createClient();
}

async function writeAudit(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const db = await getAdminDb();
    await db.from("audit_logs").insert({
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata as Json,
    });
  } catch (err) {
    // Audit log gagal tidak boleh membatalkan operasi utama, tapi dicatat.
    console.error("[admin] audit log gagal:", err);
  }
}

// ---------------------------------------------------------------------------
// Kelola role pengguna
// ---------------------------------------------------------------------------

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "contributor", "moderator", "admin", "super_admin"]),
  action: z.enum(["add", "remove"]),
});

export async function actionSetUserRole(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdmin();
  if (!actor) return { error: "Akses ditolak. Khusus admin.", success: null };

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    action: formData.get("action"),
  });

  if (!parsed.success) return { error: "Input tidak valid.", success: null };

  // Hanya super_admin boleh mengelola role admin/super_admin.
  const supabase = await createClient();
  const { data: actorRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", actor.id);

  const isSuper = (actorRoles ?? []).some((r) => r.role === "super_admin");
  if (!isSuper && (parsed.data.role === "admin" || parsed.data.role === "super_admin")) {
    return { error: "Hanya super admin yang boleh mengatur role admin.", success: null };
  }

  if (parsed.data.userId === actor.id) {
    return { error: "Tidak bisa mengubah role akun sendiri.", success: null };
  }

  const admin = await getAdminDb();

  if (parsed.data.action === "add") {
    const { error } = await admin
      .from("user_roles")
      .upsert({ user_id: parsed.data.userId, role: parsed.data.role }, {
        onConflict: "user_id,role",
      });
    if (error) {
      console.error("[admin] gagal menambah role:", error.message);
      return { error: "Gagal menambah role.", success: null };
    }
  } else {
    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", parsed.data.userId)
      .eq("role", parsed.data.role);
    if (error) {
      console.error("[admin] gagal menghapus role:", error.message);
      return { error: "Gagal menghapus role.", success: null };
    }
  }

  await writeAudit(actor.id, `role_${parsed.data.action}`, "user", parsed.data.userId, {
    role: parsed.data.role,
  });

  revalidatePath("/admin/users");
  return { error: null, success: "Role diperbarui." };
}

// ---------------------------------------------------------------------------
// Moderasi laporan
// ---------------------------------------------------------------------------

export async function actionUpdateReportStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "") as Enums["report_status"];

  if (!isUuid(reportId) || !["pending", "reviewing", "resolved", "rejected"].includes(status)) return;

  const admin = await getAdminDb();
  const { error } = await admin
    .from("reports")
    .update({ status, reviewed_by: actor.id })
    .eq("id", reportId);

  if (error) {
    console.error("[admin] gagal update laporan:", error.message);
    return;
  }

  await writeAudit(actor.id, "report_status_update", "report", reportId, { status });
  revalidatePath("/admin/moderation");
}

// ---------------------------------------------------------------------------
// Status tool & artikel (aktif/nonaktif, publish/unpublish)
// ---------------------------------------------------------------------------

export async function actionToggleToolStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const toolId = String(formData.get("toolId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(toolId) || !["active", "inactive"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["tool_status"];

  const admin = await getAdminDb();
  const { error } = await admin.from("tools").update({ status: nextStatus }).eq("id", toolId);

  if (error) {
    console.error("[admin] gagal update status tool:", error.message);
    return;
  }

  await writeAudit(actor.id, "tool_status_update", "tool", toolId, { status: nextStatus });
  revalidatePath("/admin/konten");
}

export async function actionSetArticleStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const articleId = String(formData.get("articleId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(articleId) || !["draft", "review", "published", "archived"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["article_status"];

  const admin = await getAdminDb();

  const updates =
    nextStatus === "published" ? { published_at: new Date().toISOString() } : {};

  const { error } = await admin
    .from("articles")
    .update({ status: nextStatus, ...updates })
    .eq("id", articleId);

  if (error) {
    console.error("[admin] gagal update artikel:", error.message);
    return;
  }

  await writeAudit(actor.id, "article_status_update", "article", articleId, {
    status: nextStatus,
  });
  revalidatePath("/admin/konten");
}

// ---------------------------------------------------------------------------
// Kelola status komunitas, event, lowongan, dan marketplace
// ---------------------------------------------------------------------------

export async function actionSetCommunityStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const communityId = String(formData.get("communityId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(communityId) || !["active", "suspended", "archived"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["community_status"];
  const admin = await getAdminDb();
  const { data: updated, error } = await admin
    .from("communities")
    .update({ status: nextStatus })
    .eq("id", communityId)
    .select("slug")
    .single();

  if (error) {
    console.error("[admin] gagal update komunitas:", error.message);
    return;
  }

  await writeAudit(actor.id, "community_status_update", "community", communityId, {
    status: nextStatus,
  });
  revalidatePath("/admin/konten");
  revalidatePath("/komunitas");
  if (updated?.slug) revalidatePath(`/komunitas/${updated.slug}`);
}

export async function actionSetEventStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const eventId = String(formData.get("eventId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(eventId) || !["published", "cancelled", "archived"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["event_status"];
  const admin = await getAdminDb();
  const { data: updated, error } = await admin
    .from("events")
    .update({ status: nextStatus })
    .eq("id", eventId)
    .select("slug")
    .single();

  if (error) {
    console.error("[admin] gagal update event:", error.message);
    return;
  }

  await writeAudit(actor.id, "event_status_update", "event", eventId, { status: nextStatus });
  revalidatePath("/admin/konten");
  revalidatePath("/event");
  if (updated?.slug) revalidatePath(`/event/${updated.slug}`);
}

export async function actionSetJobStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const jobId = String(formData.get("jobId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(jobId) || !["published", "closed"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["job_status"];
  const admin = await getAdminDb();
  const { data: updated, error } = await admin
    .from("job_listings")
    .update({ status: nextStatus })
    .eq("id", jobId)
    .select("slug")
    .single();

  if (error) {
    console.error("[admin] gagal update lowongan:", error.message);
    return;
  }

  await writeAudit(actor.id, "job_status_update", "job", jobId, { status: nextStatus });
  revalidatePath("/admin/konten");
  revalidatePath("/karier");
  if (updated?.slug) revalidatePath(`/karier/${updated.slug}`);
}

export async function actionSetMarketplaceProductStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const productId = String(formData.get("productId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!isUuid(productId) || !["draft", "published", "archived"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["marketplace_product_status"];
  const admin = await getAdminDb();
  const { data: updated, error } = await admin
    .from("marketplace_products")
    .update({ status: nextStatus })
    .eq("id", productId)
    .select("slug")
    .single();

  if (error) {
    console.error("[admin] gagal update produk marketplace:", error.message);
    return;
  }

  await writeAudit(actor.id, "marketplace_status_update", "marketplace", productId, {
    status: nextStatus,
  });
  revalidatePath("/admin/konten");
  revalidatePath("/marketplace");
  if (updated?.slug) revalidatePath(`/marketplace/${updated.slug}`);
}

// ---------------------------------------------------------------------------
// Kelola pelanggan newsletter & pengaturan situs (`site_settings`)
// ---------------------------------------------------------------------------

export async function actionToggleNewsletterSubscriber(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const subscriberId = String(formData.get("subscriberId") || "");
  const nextActive = formData.get("nextActive") === "true";
  if (!isUuid(subscriberId)) return;

  const admin = await getAdminDb();
  const { error } = await admin
    .from("newsletter_subscribers")
    .update({
      is_active: nextActive,
      unsubscribed_at: nextActive ? null : new Date().toISOString(),
    })
    .eq("id", subscriberId);

  if (error) {
    console.error("[admin] gagal update subscriber newsletter:", error.message);
    return;
  }

  await writeAudit(actor.id, "newsletter_status_update", "newsletter", subscriberId, {
    is_active: nextActive,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
}

const announcementSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(240, "Pesan pengumuman maksimal 240 karakter"),
  ctaLabel: z.string().trim().max(40, "Label tombol maksimal 40 karakter"),
  ctaHref: z.string().trim().max(300, "Tautan terlalu panjang"),
});

export async function actionSaveSiteAnnouncement(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireAdmin();
  if (!actor) return { error: "Akses ditolak. Khusus admin.", success: null };

  const parsed = announcementSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    message: String(formData.get("message") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaHref: String(formData.get("ctaHref") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid.", success: null };
  }

  if (parsed.data.enabled && parsed.data.message.length < 5) {
    return {
      error: "Tulis pesan pengumuman minimal 5 karakter sebelum mengaktifkan banner.",
      success: null,
    };
  }

  const hrefCheck = normalizeAnnouncementHref(parsed.data.ctaHref);
  if (!hrefCheck.ok) {
    return { error: hrefCheck.error, success: null };
  }

  const admin = await getAdminDb();
  const value: Record<string, Json> = {
    enabled: parsed.data.enabled,
    message: parsed.data.message,
    ctaLabel: parsed.data.ctaLabel,
    ctaHref: hrefCheck.value,
  };

  const { data: saved, error } = await admin
    .from("site_settings")
    .upsert(
      {
        key: PLATFORM_ANNOUNCEMENT_KEY,
        value,
        updated_by: actor.id,
      },
      { onConflict: "key" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[admin] gagal menyimpan site_settings:", error.message);
    return { error: "Gagal menyimpan pengaturan pengumuman.", success: null };
  }

  await writeAudit(actor.id, "site_setting_update", "site_setting", saved?.id ?? null, {
    key: PLATFORM_ANNOUNCEMENT_KEY,
    enabled: parsed.data.enabled,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/pengaturan");
  return { error: null, success: "Pengaturan pengumuman situs disimpan." };
}
