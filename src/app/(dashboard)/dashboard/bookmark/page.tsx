import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  BookOpen,
  CalendarDays,
  Briefcase,
  Wrench,
  MessageSquare,
  Bookmark as BookmarkIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId } from "@/lib/utils";
import { getToolBySlug } from "@/modules/tools/tools-registry/registry";

export const metadata: Metadata = { title: "Bookmark" };

type BookmarkRow = {
  id: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
};

interface ResolvedBookmark extends BookmarkRow {
  title: string;
  href: string;
  meta: string | null;
}

const typeIcons = {
  tool: Wrench,
  article: BookOpen,
  post: MessageSquare,
  event: CalendarDays,
  job: Briefcase,
} as const;

const typeLabels = {
  tool: "Tool",
  article: "Artikel",
  post: "Diskusi",
  event: "Event",
  job: "Loker",
} as const;

export default async function BookmarkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/bookmark");

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (bookmarks ?? []) as BookmarkRow[];

  // Resolusi judul per tipe resource (query terpisah per tabel).
  const resolved: ResolvedBookmark[] = [];

  const articleIds = rows.filter((r) => r.resource_type === "article").map((r) => r.resource_id);
  const postIds = rows.filter((r) => r.resource_type === "post").map((r) => r.resource_id);
  const eventIds = rows.filter((r) => r.resource_type === "event").map((r) => r.resource_id);
  const jobIds = rows.filter((r) => r.resource_type === "job").map((r) => r.resource_id);

  const [articleMap, postMap, eventMap, jobMap] = await Promise.all([
    articleIds.length > 0
      ? supabase
          .from("articles")
          .select("id, title, slug")
          .in("id", articleIds)
          .then(({ data }) => new Map((data ?? []).map((a) => [a.id, a])))
      : Promise.resolve(new Map()),
    postIds.length > 0
      ? supabase
          .from("posts")
          .select("id, title, slug")
          .in("id", postIds)
          .then(({ data }) => new Map((data ?? []).map((p) => [p.id, p])))
      : Promise.resolve(new Map()),
    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, title, slug")
          .in("id", eventIds)
          .then(({ data }) => new Map((data ?? []).map((e) => [e.id, e])))
      : Promise.resolve(new Map()),
    jobIds.length > 0
      ? supabase
          .from("job_listings")
          .select("id, title, slug")
          .in("id", jobIds)
          .then(({ data }) => new Map((data ?? []).map((j) => [j.id, j])))
      : Promise.resolve(new Map()),
  ]);

  for (const row of rows) {
    if (row.resource_type === "article") {
      const a = articleMap.get(row.resource_id);
      if (a) {
        resolved.push({
          ...row,
          title: a.title,
          href: `/artikel/${a.slug}`,
          meta: typeLabels.article,
        });
      }
    } else if (row.resource_type === "post") {
      const p = postMap.get(row.resource_id);
      if (p) {
        resolved.push({
          ...row,
          title: p.title,
          href: `/diskusi/${p.slug}`,
          meta: typeLabels.post,
        });
      }
    } else if (row.resource_type === "event") {
      const e = eventMap.get(row.resource_id);
      if (e) {
        resolved.push({
          ...row,
          title: e.title,
          href: `/event/${e.slug}`,
          meta: typeLabels.event,
        });
      }
    } else if (row.resource_type === "job") {
      const j = jobMap.get(row.resource_id);
      if (j) {
        resolved.push({
          ...row,
          title: j.title,
          href: `/karier/${j.slug}`,
          meta: typeLabels.job,
        });
      }
    } else if (row.resource_type === "tool") {
      // Tool disimpan sebagai slug dari registry statis.
      const tool = getToolBySlug(row.resource_id);
      if (tool) {
        resolved.push({
          ...row,
          title: tool.name,
          href: tool.route,
          meta: typeLabels.tool,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Bookmark</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {resolved.length} item tersimpan. Bookmark hanya terlihat oleh kamu.
        </p>
      </div>

      {resolved.length > 0 ? (
        <Card>
          <ul className="divide-y divide-slate-100">
            {resolved.map((item) => {
              const Icon = typeIcons[item.resource_type as keyof typeof typeIcons] ?? BookmarkIcon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3.5 p-4 transition-colors hover:bg-surface-muted"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                      <p className="text-xs text-ink-muted">
                        {item.meta} · disimpan {timeAgoId(item.created_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center">
          <p className="font-semibold text-ink">Belum ada bookmark</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            Simpan artikel, diskusi, dan tool favoritmu dengan tombol bookmark,
            akan tersedia di seluruh halaman konten.
          </p>
          <Link
            href="/artikel"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Jelajahi artikel →
          </Link>
        </div>
      )}
    </div>
  );
}
