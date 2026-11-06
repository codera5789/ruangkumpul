"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Json } from "@/types/database";

export interface AdminActionState {
  error: string | null;
  success: string | null;
}

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

async function writeAudit(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
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

  const admin = createAdminClient();

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

  if (!reportId || !["pending", "reviewing", "resolved", "rejected"].includes(status)) return;

  const admin = createAdminClient();
  await admin
    .from("reports")
    .update({ status, reviewed_by: actor.id })
    .eq("id", reportId);

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
  if (!toolId || !["active", "inactive"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["tool_status"];

  const admin = createAdminClient();
  await admin.from("tools").update({ status: nextStatus }).eq("id", toolId);

  await writeAudit(actor.id, "tool_status_update", "tool", toolId, { status: nextStatus });
  revalidatePath("/admin/konten");
}

export async function actionSetArticleStatus(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  if (!actor) return;

  const articleId = String(formData.get("articleId") || "");
  const rawStatus = String(formData.get("nextStatus") || "");
  if (!articleId || !["draft", "review", "published", "archived"].includes(rawStatus)) return;

  const nextStatus = rawStatus as Enums["article_status"];

  const admin = createAdminClient();

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
