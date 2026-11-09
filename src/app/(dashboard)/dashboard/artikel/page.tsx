import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FileText, PenLine, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDateId } from "@/lib/utils";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { actionDeleteArticle } from "@/modules/knowledge/actions";

export const metadata: Metadata = { title: "Artikel Saya" };

const statusMeta: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  review: { label: "Review", cls: "bg-amber-100 text-amber-700" },
  published: { label: "Terbit", cls: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Arsip", cls: "bg-slate-100 text-slate-400" },
};

export default async function ArtikelSayaPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/artikel");

  const [{ data: articles }, { data: roles }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, slug, status, view_count, created_at, updated_at, article_categories (name)")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.rpc("has_any_role", {
      roles: ["contributor", "moderator", "admin", "super_admin"],
    }),
  ]);

  const { created } = await searchParams;
  const isContributor = Boolean(roles);
  const rows = articles ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Artikel Saya</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {rows.length} artikel ditulis.
          </p>
        </div>
        {isContributor ? (
          <Button asChild>
            <Link href="/dashboard/artikel/baru">
              <Plus className="size-4" aria-hidden="true" />
              Tulis Artikel
            </Link>
          </Button>
        ) : null}
      </div>

      {created ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          Artikel berhasil disimpan.
        </p>
      ) : null}

      {!isContributor ? (
        <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-12 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <PenLine className="size-6" aria-hidden="true" />
          </span>
          <p className="font-semibold text-ink">Fitur kontributor belum aktif untuk akunmu</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
            Untuk menulis artikel, akunmu memerlukan role <strong>kontributor</strong>. Hubungi admin
            melalui halaman <Link href="/kontak" className="font-semibold text-brand-700 hover:underline">kontak</Link>{" "}
            dengan menyertakan topik yang ingin kamu tulis.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-12 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <p className="font-semibold text-ink">Belum ada artikel</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            Bagikan pengetahuanmu dengan menulis artikel pertama.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/artikel/baru">Tulis Artikel Pertama</Link>
          </Button>
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {rows.map((a) => {
              const meta = statusMeta[a.status] ?? statusMeta.draft;
              const cat = Array.isArray(a.article_categories)
                ? a.article_categories[0]?.name
                : a.article_categories?.name;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {cat ? `${cat} · ` : ""}
                      Diubah {formatDateId(a.updated_at, { day: "numeric", month: "short", year: "numeric" })}
                      {a.status === "published" ? ` · ${a.view_count} dibaca` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.status === "published" ? (
                      <Link
                        href={`/artikel/${a.slug}`}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Lihat
                      </Link>
                    ) : null}
                    <Link
                      href={`/dashboard/artikel/${a.id}/edit`}
                      className="text-xs font-semibold text-ink-secondary hover:text-ink"
                    >
                      Edit
                    </Link>
                    <ConfirmForm
                      action={actionDeleteArticle}
                      fields={{ articleId: a.id }}
                      message={`Hapus artikel "${a.title}"? Tindakan ini tidak bisa dibatalkan.`}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold text-ink-muted transition-colors hover:text-red-600"
                      >
                        Hapus
                      </button>
                    </ConfirmForm>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Badge variant="outline">Tips</Badge>
        Artikel berstatus review akan diperiksa moderator sebelum tayang publik.
      </p>
    </div>
  );
}
