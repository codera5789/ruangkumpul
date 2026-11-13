import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, timeAgoId } from "@/lib/utils";
import { AdminFilterTabs } from "@/modules/admin/components/admin-filter-tabs";

export const metadata: Metadata = { title: "Admin · Audit Log" };

const PAGE_SIZE = 30;

const RESOURCE_TYPES = [
  { value: "all", label: "Semua" },
  { value: "user", label: "Pengguna" },
  { value: "report", label: "Laporan" },
  { value: "tool", label: "Tools" },
  { value: "article", label: "Artikel" },
  { value: "community", label: "Komunitas" },
  { value: "marketplace", label: "Marketplace" },
  { value: "event", label: "Event" },
  { value: "job", label: "Lowongan" },
  { value: "newsletter", label: "Newsletter" },
  { value: "site_setting", label: "Pengaturan" },
] as const;

const VALID_TYPES = new Set<string>(RESOURCE_TYPES.map((t) => t.value));

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; page?: string }>;
}) {
  const { tipe, page: pageParam } = await searchParams;
  const activeType = VALID_TYPES.has(tipe ?? "") ? (tipe as string) : "all";
  const page = parsePageParam(pageParam);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let request = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, resource_type, resource_id, metadata, created_at, profiles (username, full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (activeType !== "all") {
    request = request.eq("resource_type", activeType);
  }

  const { data: logs, count, error } = await request.range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[admin/audit] query gagal:", error.message);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const filterTabs = RESOURCE_TYPES.map((t) => ({
    label: t.label,
    href: t.value === "all" ? "/admin/audit" : `/admin/audit?tipe=${t.value}`,
    active: activeType === t.value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
          <ScrollText className="size-6 text-brand-700" aria-hidden="true" />
          Audit Log Admin
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Rekam jejak otomatis seluruh aksi moderasi, perubahan role, status konten, dan pengaturan
          situs ({count ?? 0} catatan).
        </p>
      </div>

      <AdminFilterTabs label="Filter tipe sumber audit" items={filterTabs} />

      <Card>
        {(logs ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-secondary">
            Belum ada catatan audit log{activeType !== "all" ? ` untuk tipe "${activeType}"` : ""}.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(logs ?? []).map((log) => {
              const actorName = log.profiles?.full_name || log.profiles?.username || "Sistem";
              const actorHandle = log.profiles?.username ? `@${log.profiles.username}` : "";
              const metaJson =
                log.metadata &&
                typeof log.metadata === "object" &&
                Object.keys(log.metadata).length > 0
                  ? JSON.stringify(log.metadata)
                  : null;

              return (
                <li key={log.id} className="space-y-1.5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{log.resource_type}</Badge>
                      <span className="font-mono text-xs font-semibold text-ink">
                        {log.action}
                      </span>
                      {log.resource_id ? (
                        <span className="font-mono text-[11px] text-ink-muted">
                          id:{log.resource_id.slice(0, 8)}…
                        </span>
                      ) : null}
                    </div>
                    <time
                      dateTime={log.created_at}
                      title={formatDateId(log.created_at, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      className="text-xs text-ink-muted"
                    >
                      {timeAgoId(log.created_at)}
                    </time>
                  </div>

                  <p className="text-xs text-ink-secondary">
                    Aktor: <span className="font-semibold text-ink">{actorName}</span>{" "}
                    {actorHandle ? <span className="text-ink-muted">({actorHandle})</span> : null}
                  </p>

                  {metaJson ? (
                    <pre className="overflow-x-auto rounded-lg bg-surface-muted px-3 py-1.5 font-mono text-[11px] text-ink-secondary">
                      {metaJson}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/audit"
        query={activeType !== "all" ? { tipe: activeType } : undefined}
      />
    </div>
  );
}
