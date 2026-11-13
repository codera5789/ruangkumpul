import Link from "next/link";
import { Megaphone } from "lucide-react";
import { withFailSoft } from "@/lib/supabase/query";
import { createPublicClient } from "@/lib/supabase/public";
import {
  DEFAULT_PLATFORM_ANNOUNCEMENT,
  parsePlatformAnnouncement,
  PLATFORM_ANNOUNCEMENT_KEY,
} from "@/modules/admin/settings";

/**
 * Banner pengumuman global dari tabel `site_settings` (`platform_announcement`).
 * Dibungkus `<Suspense fallback={null}>` di layout publik agar tidak memblokir shell statis.
 */
export async function SiteAnnouncementBanner() {
  const announcement = await withFailSoft(
    "[site-announcement] gagal memuat banner:",
    DEFAULT_PLATFORM_ANNOUNCEMENT,
    async () => {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", PLATFORM_ANNOUNCEMENT_KEY)
        .maybeSingle();

      return parsePlatformAnnouncement(data?.value);
    },
  );

  if (!announcement.enabled || !announcement.message) return null;

  const isExternal = announcement.ctaHref.startsWith("http");

  return (
    <div
      role="region"
      aria-label="Pengumuman platform"
      className="border-b border-brand-900/20 bg-brand-800 px-4 py-2 text-xs text-white sm:text-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Megaphone className="size-3.5 shrink-0" aria-hidden="true" />
          {announcement.message}
        </span>
        {announcement.ctaHref ? (
          isExternal ? (
            <a
              href={announcement.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-2 hover:text-brand-100"
            >
              {announcement.ctaLabel || "Selengkapnya"} →
            </a>
          ) : (
            <Link
              href={announcement.ctaHref}
              className="font-bold underline underline-offset-2 hover:text-brand-100"
            >
              {announcement.ctaLabel || "Selengkapnya"} →
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
