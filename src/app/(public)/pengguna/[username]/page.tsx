import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Globe2, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReportButton } from "@/components/shared/report-button";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { listArticlesByAuthor } from "@/modules/knowledge/services";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { formatDateId } from "@/lib/utils";

interface ProfilPublikPageProps {
  params: Promise<{ username: string }>;
}

/** Profil publik — di-cache per request: generateMetadata + konten halaman
 *  memakai satu query, bukan dua. */
const getProfilByUsername = cache(async (username: string) => {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();
    return profile ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: ProfilPublikPageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfilByUsername(username);

  if (!profile) return { title: "Pengguna tidak ditemukan" };

  return {
    title: `${profile.full_name || profile.username} (@${profile.username})`,
    description: profile.bio ?? `Profil publik ${profile.username} di RuangKumpul.`,
    alternates: { canonical: `/pengguna/${profile.username}` },
    openGraph: {
      title: `${profile.full_name || profile.username} (@${profile.username})`,
      description: profile.bio ?? `Profil publik ${profile.username} di RuangKumpul.`,
      url: `/pengguna/${profile.username}`,
      type: "profile",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.full_name || profile.username} (@${profile.username})`,
      description: profile.bio ?? `Profil publik ${profile.username} di RuangKumpul.`,
      images: [siteConfig.ogImage],
    },
  };
}

async function ProfilContent({ params }: ProfilPublikPageProps) {
  const { username } = await params;

  const profile = await getProfilByUsername(username);
  if (!profile) notFound();

  // Artikel published milik pengguna ini (query langsung, bukan filter di memori).
  const userArticles = await listArticlesByAuthor(profile.id, 6);

  const supabase = await createClient();
  const [
    { count: communityCount },
    {
      data: { user: viewer },
    },
  ] = await Promise.all([
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="animate-slide-up-far">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Kartu profil */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name || profile.username}
              className="size-20 text-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
                    {profile.full_name || profile.username}
                    {profile.is_verified ? (
                      <Badge variant="brand">Terverifikasi</Badge>
                    ) : null}
                  </h1>
                  <p className="text-sm text-ink-secondary">@{profile.username}</p>
                </div>
                {viewer?.id !== profile.id ? (
                  <ReportButton
                    targetType="user"
                    targetId={profile.id}
                    redirectTo={`/pengguna/${profile.username}`}
                    isLoggedIn={Boolean(viewer)}
                  />
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-3 text-pretty leading-relaxed text-ink-secondary">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Bergabung {formatDateId(profile.created_at, { month: "long", year: "numeric" })}
                </span>
                {profile.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {profile.location}
                  </span>
                ) : null}
                {profile.website_url ? (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                  >
                    <Globe2 className="size-4" aria-hidden="true" />
                    Website
                  </a>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" aria-hidden="true" />
                  {communityCount ?? 0} komunitas
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Artikel penulis */}
        <section className="mt-10" aria-labelledby="artikel-penulis">
          <h2 id="artikel-penulis" className="text-xl font-extrabold text-ink">
            Artikel {profile.full_name ? profile.full_name.split(" ")[0] : "pengguna ini"}
          </h2>
          {userArticles.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {userArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
              Belum menulis artikel.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-card bg-slate-200/50" />
      <div className="mt-8 h-24 animate-pulse rounded-card bg-slate-200/50" />
    </div>
  );
}

export default function ProfilPublikPage({ params }: ProfilPublikPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfilContent params={params} />
    </Suspense>
  );
}
