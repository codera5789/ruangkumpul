import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId } from "@/lib/utils";
import { actionUpdateReportStatus } from "@/modules/admin/actions";
import { AdminFilterTabs } from "@/modules/admin/components/admin-filter-tabs";
import type { Enums } from "@/types/database";

export const metadata: Metadata = { title: "Admin · Moderasi" };

const statusVariants = {
  pending: "warning",
  reviewing: "brand",
  resolved: "success",
  rejected: "default",
} as const;

const TARGET_LABELS: Record<string, string> = {
  post: "Diskusi",
  comment: "Komentar",
  article: "Artikel",
  community: "Komunitas",
  user: "Pengguna",
};

const VALID_STATUSES = new Set<Enums["report_status"]>([
  "pending",
  "reviewing",
  "resolved",
  "rejected",
]);

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const activeStatus = VALID_STATUSES.has(rawStatus as Enums["report_status"])
    ? (rawStatus as Enums["report_status"])
    : "all";

  const supabase = await createClient();

  let request = supabase
    .from("reports")
    .select(
      `id, target_type, target_id, reason, description, status, created_at,
       reporter:profiles!reports_reporter_id_fkey (username),
       reviewer:profiles!reports_reviewed_by_fkey (username)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (activeStatus !== "all") {
    request = request.eq("status", activeStatus);
  }

  const [{ data: reports }, { count: pendingCount }] = await Promise.all([
    request,
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const filterTabs = [
    { label: "Semua", href: "/admin/moderation", active: activeStatus === "all" },
    {
      label: "Pending",
      href: "/admin/moderation?status=pending",
      active: activeStatus === "pending",
      count: pendingCount ?? 0,
    },
    { label: "Ditinjau", href: "/admin/moderation?status=reviewing", active: activeStatus === "reviewing" },
    { label: "Selesai", href: "/admin/moderation?status=resolved", active: activeStatus === "resolved" },
    { label: "Ditolak", href: "/admin/moderation?status=rejected", active: activeStatus === "rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Moderasi</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Antrean laporan konten. Tinjau lalu tandai statusnya.
        </p>
      </div>

      <AdminFilterTabs label="Filter status laporan" items={filterTabs} />

      {reports && reports.length > 0 ? (
        <Card>
          <ul className="divide-y divide-slate-100">
            {reports.map((report) => (
              <li key={report.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariants[report.status]}>{report.status}</Badge>
                  <span className="text-xs text-ink-muted">
                    {TARGET_LABELS[report.target_type] ?? report.target_type} ({report.target_id.slice(0, 8)}…) ·{" "}
                    {report.reason} · oleh @{report.reporter?.username ?? "?"} ·{" "}
                    {timeAgoId(report.created_at)}
                  </span>
                </div>

                {report.description ? (
                  <p className="mt-2 text-sm text-ink-secondary">{report.description}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {(["reviewing", "resolved", "rejected"] as const).map((next) => (
                    <form key={next} action={actionUpdateReportStatus}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value={next} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:text-ink disabled:opacity-50"
                        disabled={report.status === next}
                      >
                        {next === "reviewing"
                          ? "Tandai ditinjau"
                          : next === "resolved"
                            ? "Selesaikan"
                            : "Tolak laporan"}
                      </button>
                    </form>
                  ))}
                  {report.reviewer?.username ? (
                    <span className="self-center text-xs text-ink-muted">
                      ditinjau @{report.reviewer.username}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center text-sm text-ink-secondary">
          {activeStatus === "all"
            ? "Tidak ada laporan. Platform dalam kondisi sehat 🎉"
            : `Tidak ada laporan dengan status "${activeStatus}".`}
        </p>
      )}
    </div>
  );
}
