import Link from "next/link";
import { ArrowRight, Bell, MessageSquare, Sparkles, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId, truncate } from "@/lib/utils";

interface PersonalFeedPost {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  author: { username: string; full_name: string | null; avatar_url: string | null } | null;
  community: { name: string; slug: string } | null;
}

/**
 * Feed personal untuk pengguna login: diskusi terbaru dari komunitas yang
 * diikuti + notifikasi belum dibaca. Tidak dirender untuk tamu.
 */
export async function PersonalizedSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: memberships }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("username, full_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("community_members")
      .select("community_id, communities (name, slug)")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .limit(20),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  if (!profile) return null;

  const communityList = (memberships ?? [])
    .map((m) => {
      const c = Array.isArray(m.communities) ? m.communities[0] : m.communities;
      return c && "slug" in c ? { name: c.name, slug: c.slug, id: m.community_id } : null;
    })
    .filter((c): c is { name: string; slug: string; id: string } => Boolean(c));

  // Diskusi terbaru dari komunitas yang diikuti (maks. 5).
  let posts: PersonalFeedPost[] = [];
  if (communityList.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select(
        `id, title, slug, created_at,
         profiles (username, full_name, avatar_url),
         communities (name, slug)`,
      )
      .in(
        "community_id",
        communityList.map((c) => c.id),
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5);
    posts = (data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      created_at: p.created_at,
      author: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      community: Array.isArray(p.communities) ? p.communities[0] : p.communities,
    })) as PersonalFeedPost[];
  }

  const hasContent = posts.length > 0 || communityList.length > 0 || (unreadCount ?? 0) > 0;
  if (!hasContent) return null;

  const firstName = (profile.full_name || profile.username).split(" ")[0];

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6" aria-labelledby="feed-saya">
      <Card className="border-brand-200/60 bg-gradient-to-br from-brand-50/60 to-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="feed-saya" className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <Sparkles className="size-5 text-brand-700" aria-hidden="true" />
            Halo {firstName}, kabar terbaru untukmu
          </h2>
          {(unreadCount ?? 0) > 0 ? (
            <Link
              href="/dashboard/notifikasi"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-800 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-700"
            >
              <Bell className="size-3.5" aria-hidden="true" />
              {unreadCount} notifikasi baru
            </Link>
          ) : null}
        </div>

        {posts.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/diskusi/${post.slug}`}
                  className="group flex items-center gap-3 py-3"
                >
                  <Avatar
                    src={post.author?.avatar_url}
                    name={post.author?.full_name || post.author?.username || "Pengguna"}
                    className="size-9"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-800">
                      {truncate(post.title, 70)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {post.community ? `${post.community.name} · ` : ""}
                      {timeAgoId(post.created_at)}
                    </p>
                  </div>
                  <MessageSquare className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : communityList.length > 0 ? (
          <p className="mt-3 text-sm text-ink-secondary">
            Komunitasmu masih tenang. Mulailah diskusi pertama!
          </p>
        ) : null}

        {communityList.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {communityList.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/komunitas/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-brand-300 hover:text-brand-800"
              >
                <Users className="size-3" aria-hidden="true" />
                {c.name}
              </Link>
            ))}
            <Link
              href="/komunitas"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              Temukan komunitas lain <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <Link
              href="/komunitas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              Gabung komunitas pertamamu <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </Card>
    </section>
  );
}
