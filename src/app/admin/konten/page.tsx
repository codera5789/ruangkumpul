import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { actionSetArticleStatus, actionToggleToolStatus } from "@/modules/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { formatDateId } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Tools & Artikel" };

export default async function AdminKontenPage() {
  const supabase = await createClient();

  const [{ data: tools }, { data: articles }] = await Promise.all([
    supabase
      .from("tools")
      .select("id, name, slug, status, usage_count, route")
      .order("name")
      .limit(50),
    supabase
      .from("articles")
      .select("id, title, slug, status, view_count, created_at, profiles (username)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-10">
      {/* Tools */}
      <section aria-labelledby="kelola-tools">
        <h1 id="kelola-tools" className="text-2xl font-extrabold tracking-tight text-ink">
          Tools
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Nonaktifkan tool untuk menyembunyikannya dari direktori publik.
        </p>

        <Card className="mt-4">
          <ul className="divide-y divide-slate-100">
            {(tools ?? []).map((tool) => (
              <li key={tool.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={tool.route}
                    className="text-sm font-semibold text-ink hover:text-brand-800"
                  >
                    {tool.name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    /{tool.slug} · {tool.usage_count} kali dipakai
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tool.status === "active" ? "success" : "danger"}>
                    {tool.status === "active" ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <form action={actionToggleToolStatus}>
                    <input type="hidden" name="toolId" value={tool.id} />
                    <input
                      type="hidden"
                      name="nextStatus"
                      value={tool.status === "active" ? "inactive" : "active"}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                    >
                      {tool.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Artikel */}
      <section aria-labelledby="kelola-artikel">
        <h2 id="kelola-artikel" className="text-2xl font-extrabold tracking-tight text-ink">
          Artikel
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Kelola status publikasi artikel kontributor.
        </p>

        <Card className="mt-4">
          <ul className="divide-y divide-slate-100">
            {(articles ?? []).length === 0 ? (
              <li className="p-6 text-center text-sm text-ink-secondary">
                Belum ada artikel di database.
              </li>
            ) : (
              (articles ?? []).map((article) => (
                <li key={article.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/artikel/${article.slug}`}
                      className="text-sm font-semibold text-ink hover:text-brand-800"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      @{article.profiles?.username ?? "—"} ·{" "}
                      {formatDateId(article.created_at)} · {article.view_count} dibaca
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        article.status === "published"
                          ? "success"
                          : article.status === "review"
                            ? "warning"
                            : "default"
                      }
                    >
                      {article.status}
                    </Badge>
                    {article.status === "published" ? (
                      <form action={actionSetArticleStatus}>
                        <input type="hidden" name="articleId" value={article.id} />
                        <input type="hidden" name="nextStatus" value="archived" />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                        >
                          Arsipkan
                        </button>
                      </form>
                    ) : (
                      <form action={actionSetArticleStatus}>
                        <input type="hidden" name="articleId" value={article.id} />
                        <input type="hidden" name="nextStatus" value="published" />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Terbitkan
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}
