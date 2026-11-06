import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Eye, Tag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { siteConfig } from "@/config/site";
import { formatDateId, formatCompactId } from "@/lib/utils";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { ArticleContent } from "@/modules/knowledge/components/article-content";
import {
  CommentForm,
  CommentItem,
} from "@/modules/knowledge/components/comment-section";
import { ArticleViewTracker } from "@/modules/knowledge/components/article-view-tracker";
import {
  getArticleBySlug,
  listArticleComments,
  listRelatedArticles,
} from "@/modules/knowledge/services";
import { createClient } from "@/lib/supabase/server";

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return { title: "Artikel tidak ditemukan" };

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || undefined,
    alternates: { canonical: `/artikel/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt || undefined,
      url: `/artikel/${article.slug}`,
      publishedTime: article.published_at ?? undefined,
      authors: article.profiles?.full_name
        ? [article.profiles.full_name]
        : undefined,
      images: article.featured_image ? [{ url: article.featured_image }] : undefined,
    },
  };
}

async function ArticleDetailContent({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const [comments, related, supabaseSession] = await Promise.all([
    listArticleComments(article.id),
    listRelatedArticles(article.id, article.category_id, 3),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabaseSession.auth.getUser();

  const authorName =
    article.profiles?.full_name || article.profiles?.username || "Tim RuangKumpul";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.featured_image ?? undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: authorName,
      url: article.profiles ? `${siteConfig.url}/pengguna/${article.profiles.username}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: `${siteConfig.url}/artikel/${article.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Artikel", item: `${siteConfig.url}/artikel` },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${siteConfig.url}/artikel/${article.slug}`,
      },
    ],
  };

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ArticleViewTracker slug={article.slug} />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-6 text-sm text-ink-secondary sm:px-6"
      >
        <Link href="/" className="hover:text-brand-800">Beranda</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <Link href="/artikel" className="hover:text-brand-800">Artikel</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <span className="truncate font-medium text-ink">{article.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pt-4 pb-10 sm:px-6">
        {/* Header */}
        <header className="space-y-4">
          {article.article_categories ? (
            <Link href={`/artikel?kategori=${article.article_categories.slug}`}>
              <Badge variant="brand">{article.article_categories.name}</Badge>
            </Link>
          ) : null}

          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="text-pretty text-lg leading-relaxed text-ink-secondary">
              {article.excerpt}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={article.profiles?.avatar_url}
                name={authorName}
                className="size-9"
              />
              <div>
                <p className="text-sm font-bold text-ink">{authorName}</p>
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  {article.published_at ? formatDateId(article.published_at) : null}
                  <span aria-hidden="true">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {formatCompactId(article.view_count)} dibaca
                  </span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Gambar utama */}
        {article.featured_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.featured_image}
            alt={article.title}
            className="mt-6 aspect-16/9 w-full rounded-card border border-slate-200 object-cover"
          />
        ) : null}

        {/* Konten */}
        <div className="mt-8">
          <ArticleContent content={article.content} />
        </div>

        {/* Tags */}
        {article.article_tag_relations?.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Tag className="size-4 text-ink-muted" aria-hidden="true" />
            {article.article_tag_relations.map((rel) => (
              <Badge key={rel.tags.slug} variant="outline">
                {rel.tags.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </article>

      {/* Komentar */}
      <section
        className="mx-auto max-w-3xl px-4 pb-10 sm:px-6"
        aria-labelledby="komentar"
      >
        <h2 id="komentar" className="text-xl font-extrabold text-ink">
          Diskusi ({comments.length})
        </h2>

        <div className="mt-5">
          <CommentForm slug={article.slug} isLoggedIn={Boolean(user)} />
        </div>

        {comments.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100 rounded-card border border-slate-200/80 bg-surface px-5">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            Belum ada komentar. Jadilah yang pertama berkomentar!
          </p>
        )}
      </section>

      {/* Artikel terkait */}
      {related.length > 0 ? (
        <section
          className="mx-auto max-w-5xl px-4 pb-16 sm:px-6"
          aria-labelledby="terkait"
        >
          <h2 id="terkait" className="mb-4 text-xl font-extrabold text-ink">
            Baca juga
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <ArticleDetailContent params={params} />
    </Suspense>
  );
}
