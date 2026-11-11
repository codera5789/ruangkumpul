import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, MessageSquare, ShieldCheck, ThumbsUp, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { siteConfig } from "@/config/site";
import { formatCompactId, timeAgoId } from "@/lib/utils";
import { CreatePostForm } from "@/modules/community/components/create-post-form";
import { JoinLeaveButtons } from "@/modules/community/components/join-leave-buttons";
import { getCommunityBySlug, listCommunityPosts } from "@/modules/community/queries";

interface CommunityDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CommunityDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const context = await getCommunityBySlug(slug);
  if (!context) return { title: "Komunitas tidak ditemukan" };

  const { community } = context;
  return {
    title: `${community.name} · Komunitas`,
    description: community.description ?? undefined,
    alternates: { canonical: `/komunitas/${community.slug}` },
    openGraph: {
      title: community.name,
      description: community.description ?? undefined,
      url: `/komunitas/${community.slug}`,
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: community.name,
      description: community.description ?? undefined,
      images: [siteConfig.ogImage],
    },
  };
}

async function CommunityDetailContent({ params }: CommunityDetailPageProps) {
  const { slug } = await params;
  const context = await getCommunityBySlug(slug);

  if (!context) notFound();

  const { community, membership, isOwner } = context;
  const posts = await listCommunityPosts(community.id);

  const isApprovedMember = membership?.status === "approved";
  const isPending = membership?.status === "pending";
  const canPost = isApprovedMember || isOwner;

  return (
    <div className="animate-slide-up-far">
      {/* Header komunitas */}
      <section className="border-b border-slate-200/80 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-ink-secondary">
            <Link href="/" className="hover:text-brand-800">Beranda</Link>
            <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
            <Link href="/komunitas" className="hover:text-brand-800">Komunitas</Link>
            <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
            <span className="truncate font-medium text-ink">{community.name}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {community.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={community.icon_url}
                  alt=""
                  className="size-16 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Users className="size-8" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                    {community.name}
                  </h1>
                  {community.visibility === "private" ? (
                    <Badge variant="outline">
                      <Lock className="size-3" aria-hidden="true" /> Privat
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                  <Users className="size-4" aria-hidden="true" />
                  {formatCompactId(community.member_count)} anggota
                </p>
              </div>
            </div>

            {!isOwner ? (
              <JoinLeaveButtons
                slug={community.slug}
                isMember={isApprovedMember}
                isPending={isPending}
                isPrivate={community.visibility === "private"}
              />
            ) : (
              <div className="flex flex-col items-stretch gap-2">
                <Badge variant="brand">Kamu pemilik komunitas ini</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/komunitas/${community.slug}/anggota`}>
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Kelola Anggota
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {community.description ? (
            <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-ink-secondary">
              {community.description}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Form diskusi untuk anggota */}
        {canPost ? (
          <div className="mb-8">
            <CreatePostForm communitySlug={community.slug} />
          </div>
        ) : null}

        {/* Feed diskusi */}
        <h2 className="mb-4 text-lg font-extrabold text-ink">
          Diskusi ({posts.length})
        </h2>

        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-5 transition-shadow hover:shadow-card-hover">
                <Link href={`/diskusi/${post.slug}`} className="group block">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={post.profiles?.avatar_url}
                      name={post.profiles?.full_name || post.profiles?.username || "Pengguna"}
                      className="size-8"
                    />
                    <div className="min-w-0 text-sm">
                      <span className="font-semibold text-ink">
                        {post.profiles?.full_name || post.profiles?.username || "Pengguna"}
                      </span>
                      <span className="text-ink-muted"> · {timeAgoId(post.created_at)}</span>
                    </div>
                    {post.post_type !== "discussion" ? (
                      <Badge
                        variant={post.post_type === "question" ? "warning" : "brand"}
                        className="ml-auto"
                      >
                        {post.post_type === "question" ? "Pertanyaan" : "Pengumuman"}
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-bold text-ink transition-colors group-hover:text-brand-800">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
                    {post.content}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="size-3.5" aria-hidden="true" />
                      {formatCompactId(post.reaction_count ?? 0)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                      {formatCompactId(post.comment_count ?? 0)} komentar
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Belum ada diskusi"
            description={
              canPost
                ? "Mulai diskusi pertama di komunitas ini!"
                : isPending
                  ? "Permintaan gabung kamu menunggu persetujuan pemilik."
                  : "Gabung komunitas ini untuk mulai berdiskusi."
            }
          />
        )}
      </div>
    </div>
  );
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <CommunityDetailContent params={params} />
    </Suspense>
  );
}
