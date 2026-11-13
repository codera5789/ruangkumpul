import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDateId } from "@/lib/utils";
import { SiteAnnouncementForm } from "@/modules/admin/components/site-announcement-form";
import {
  parsePlatformAnnouncement,
  PLATFORM_ANNOUNCEMENT_KEY,
} from "@/modules/admin/settings";

export const metadata: Metadata = { title: "Admin · Pengaturan Situs" };

export default async function AdminPengaturanPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("id, key, value, updated_at, profiles (username)")
    .order("key");

  const announcementRow = (rows ?? []).find((r) => r.key === PLATFORM_ANNOUNCEMENT_KEY);
  const announcement = parsePlatformAnnouncement(announcementRow?.value);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
          <Settings className="size-6 text-brand-700" aria-hidden="true" />
          Pengaturan Situs
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Konfigurasi global yang tersimpan di tabel <code>site_settings</code>.
        </p>
      </div>

      <section
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="banner-pengumuman"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="banner-pengumuman" className="text-lg font-extrabold text-ink">
              Banner Pengumuman Situs
            </h2>
            <p className="mt-0.5 text-sm text-ink-secondary">
              Pengumuman langsung tayang di header publik saat diaktifkan.
            </p>
          </div>
          <Badge variant={announcement.enabled ? "success" : "default"}>
            {announcement.enabled ? "Sedang aktif" : "Nonaktif"}
          </Badge>
        </div>

        <SiteAnnouncementForm defaults={announcement} />
      </section>

      <section aria-labelledby="daftar-site-settings">
        <h2 id="daftar-site-settings" className="mb-3 text-lg font-extrabold text-ink">
          Kunci Tersimpan di <code>site_settings</code> ({(rows ?? []).length})
        </h2>
        <Card>
          {(rows ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-secondary">
              Belum ada konfigurasi tersimpan. Simpan pengumuman di atas untuk membuat entri pertama.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(rows ?? []).map((row) => (
                <li key={row.id} className="space-y-1.5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-ink">{row.key}</span>
                    <span className="text-xs text-ink-muted">
                      diperbarui{" "}
                      {formatDateId(row.updated_at, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {row.profiles?.username ? ` · oleh @${row.profiles.username}` : ""}
                    </span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-surface-muted px-3 py-2 font-mono text-[11px] text-ink-secondary">
                    {JSON.stringify(row.value)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
