import { Eye } from "lucide-react";
import Link from "next/link";
import { KumpulMotif } from "@/components/shared/kumpul-motif";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCompactId, formatDateId } from "@/lib/utils";
import type { ArticleWithAuthor } from "@/modules/knowledge/services";

export function ArticleCard({ article }: { article: ArticleWithAuthor }) {
  const authorName =
    article.profiles?.full_name || article.profiles?.username || "Anonim";

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-slate-200/80 bg-surface shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={`/artikel/${article.slug}`} className="flex h-full flex-col">
        {article.featured_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.featured_image}
            alt={article.title}
            className="aspect-16/9 w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="relative flex aspect-16/9 w-full items-center justify-center bg-brand-50 transition-transform duration-500 ease-out-expo group-hover:scale-105">
            <KumpulMotif className="size-28 text-brand-800/20 dark:text-brand-300/25" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-5">
          {article.article_categories ? (
            <Badge variant="brand" className="w-fit">
              {article.article_categories.name}
            </Badge>
          ) : null}

          <h3 className="text-pretty font-bold leading-snug text-ink transition-colors group-hover:text-brand-800">
            {article.title}
          </h3>

          {article.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-secondary">
              {article.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex items-center gap-2.5 pt-2">
            <Avatar
              src={article.profiles?.avatar_url}
              name={authorName}
              className="size-7"
            />
            <div className="min-w-0 flex-1 text-xs">
              <p className="truncate font-semibold text-ink">{authorName}</p>
              <p className="text-ink-muted">
                {article.published_at ? formatDateId(article.published_at) : ""}
                {article.view_count > 0 ? (
                  <span className="ml-1.5 inline-flex items-center gap-0.5">
                    <Eye className="size-3" aria-hidden="true" />
                    {formatCompactId(article.view_count)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
