import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ArticleEditorForm } from "@/modules/knowledge/components/article-editor-form";

export const metadata: Metadata = { title: "Tulis Artikel" };

export default async function TulisArtikelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/artikel/baru");

  const [{ data: allowed }, { data: categories }] = await Promise.all([
    supabase.rpc("has_any_role", {
      roles: ["contributor", "moderator", "admin", "super_admin"],
    }),
    supabase.from("article_categories").select("id, name").order("name"),
  ]);

  if (!allowed) redirect("/dashboard/artikel");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tulis Artikel</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Bagikan pengetahuanmu dengan ribuan pembaca RuangKumpul.
        </p>
      </div>

      <ArticleEditorForm
        mode="create"
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
