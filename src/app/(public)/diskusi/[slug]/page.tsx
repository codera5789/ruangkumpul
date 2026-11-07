import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Eye, Flag, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatCompactId, timeAgoId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { LikePostButton } from "@/modules/community/components/like-post-button";
import { PostCommentForm } from "@/modules/community/components/post-comment-form";
import { PostOwnerActions } from "@/modules/community/components/post-owner-actions";
import { PostViewTracker } from "@/modules/community/components/post-view-tracker";
import { CommentItem } from "@/modules/community/components/comment-item";
import { actionReportContent } from "@/modules/community/actions";
import { getPostBySlug, listPostComments } from "@/modules/community/queries";

interface DiskusiDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DiskusiDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Diskusi tidak ditemukan" };

  return {
    title: post.title,
    description: post.content.slice(0, 160),
    alternates: { canonical: `/diskusi/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160),
      url: `/diskusi/${post.slug}`,
      type: "article",
    },
  };
}

async function DiskusiDetailContent({ params }: DiskusiDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const [comments, supabase] = await Promise.all([
    listPostComments(post.id),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bookmark state + status moderator (untuk aksi moderasi lokal).
  let saved = false;
  let isModerator = false;
  if (user) {
    const [{ data: bookmark }, { data: roles }] = await Promise.all([
      supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_type", "post")
        .eq("resource_id", post.id)
        .maybeSingle(),
      supabase.rpc("is_moderator"),
    ]);
    saved = Boolean(bookmark);
    isModerator = Boolean(roles);
  }

  const authorName =
    post.profiles?.full_name || post.profiles?.username || "Pengguna";
  const liked = Boolean(post.liked);
  const isOwner = Boolean(user && post.author_id === user.id);

  return (
    <div className="animate-slide-up-far">
      <PostViewTracker slug={post.slug} />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-6 text-sm text-ink-secondary sm:px-6"
      >
        <Link href="/" className="hover:text-brand-800">Beranda</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        {post.communities ? (
          <>
            <Link href="/komunitas" className="hover:text-brand-800">Komunitas</Link>
            <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
            <Link href={`/komunitas/${post.communities.slug}`} className="hover:text-brand-800">
              {post.communities.name}
            </Link>
            <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
          </>
        ) : null}
        <span className="truncate font-medium text-ink">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Kartu diskusi */}
        <Card className="p-6">
          <div className="flex items-center gap-2.5">
            <Avatar src={post.profiles?.avatar_url} name={authorName} className="size-9" />
            <div className="min-w-0 text-sm">
              <p className="font-bold text-ink">{authorName}</p>
              <p className="text-xs text-ink-muted">{timeAgoId(post.created_at)}</p>
            </div>
            {post.post_type !== "discussion" ? (
              <Badge variant={post.post_type === "question" ? "warning" : "brand"} className="ml-auto">
                {post.post_type === "question" ? "Pertanyaan" : "Pengumuman"}
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-snug tracking-tight text-ink">
            {post.title}
          </h1>

          <div className="mt-3 text-pretty leading-relaxed break-words whitespace-pre-wrap text-ink-secondary">
            {post.content}
          </div>

          {/* Aksi edit/hapus pemilik */}
          {isOwner ? (
            <PostOwnerActions
              postSlug={post.slug}
              title={post.title}
              content={post.content}
            />
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <LikePostButton postSlug={post.slug} liked={liked} count={post.reaction_count ?? 0} />

            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <MessageSquare className="size-4" aria-hidden="true" />
              {post.comment_count ?? 0} komentar
            </span>

            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Eye className="size-4" aria-hidden="true" />
              {formatCompactId(post.view_count)} dibaca
            </span>

            <BookmarkButton
              resourceType="post"
              resourceId={post.id}
              initialSaved={saved}
              isLoggedIn={Boolean(user)}
            />

            {!isOwner ? (
              <form action={actionReportContent} className="ml-auto">
                <input type="hidden" name="targetType" value="post" />
                <input type="hidden" name="targetId" value={post.id} />
                <input type="hidden" name="reason" value="konten_tidak_pantas" />
                <input type="hidden" name="redirectTo" value={`/diskusi/${post.slug}`} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-ink-muted hover:text-red-600"
                >
                  <Flag className="size-4" aria-hidden="true" />
                  Lapor
                </Button>
              </form>
            ) : (
              <Link
                href="/panduan"
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
              >
                <BookOpen className="size-4" aria-hidden="true" />
                Panduan
              </Link>
            )}
          </div>
        </Card>

        {/* Komentar */}
        <section className="mt-8" aria-labelledby="diskusi-komentar">
          <h2 id="diskusi-komentar" className="text-lg font-extrabold text-ink">
            Komentar ({comments.length})
          </h2>

          <div className="mt-4">
            <PostCommentForm postSlug={post.slug} isLoggedIn={Boolean(user)} />
          </div>

          {comments.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-100 rounded-card border border-slate-200/80 bg-surface px-5">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postSlug={post.slug}
                  currentUserId={user?.id ?? null}
                  isModerator={isModerator}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Belum ada komentar. Bagikan pandanganmu pertama!
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DiskusiDetailPage({ params }: DiskusiDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton cards={1} />}>
      <DiskusiDetailContent params={params} />
    </Suspense>
  );
}
