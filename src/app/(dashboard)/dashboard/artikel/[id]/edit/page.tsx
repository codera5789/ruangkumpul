import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isUuid } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditorForm } from "@/modules/knowledge/components/article-editor-form";
import { blocksToMarkdown } from "@/modules/knowledge/markdown";

export const metadata: Metadata = { title: "Edit Artikel" };

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArtikelPage({ params }: EditArticlePageProps) {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/artikel/${id}/edit`);

  const [{ data: article }, { data: categories }, { data: tagRelations }, { data: allowed }] =
    await Promise.all([
      supabase
        .from("articles")
        .select(
          `id, title, excerpt, featured_image, category_id, content, status, seo_title, seo_description,
           article_tag_relations (tags (name))`,
        )
        .eq("id", id)
        .single(),
      supabase.from("article_categories").select("id, name").order("name"),
      supabase.from("article_tag_relations").select("tags (name)").eq("article_id", id),
      supabase.rpc("has_any_role", {
        roles: ["contributor", "moderator", "admin", "super_admin"],
      }),
    ]);

  if (!allowed) redirect("/dashboard/artikel");
  if (!article) notFound();

  const tagNames = (tagRelations ?? [])
    .map((rel) => (Array.isArray(rel.tags) ? rel.tags[0]?.name : rel.tags?.name))
    .filter((n): n is string => Boolean(n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Edit Artikel</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Perubahan langsung tersimpan ke draft/artikel.
        </p>
      </div>

      <ArticleEditorForm
        mode="edit"
        articleId={article.id}
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          title: article.title,
          excerpt: article.excerpt ?? "",
          categoryId: article.category_id ?? "",
          tags: tagNames.join(", "),
          markdown: blocksToMarkdown(article.content),
          featuredImage: article.featured_image ?? "",
          status: (article.status === "archived" ? "draft" : article.status) as
            | "draft"
            | "review"
            | "published",
          seoTitle: article.seo_title ?? "",
          seoDescription: article.seo_description ?? "",
        }}
      />
    </div>
  );
}
