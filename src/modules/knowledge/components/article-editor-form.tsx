"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { markdownToBlocks } from "@/modules/knowledge/markdown";
import {
  actionCreateArticle,
  actionUpdateArticle,
  type ArticleActionState,
} from "@/modules/knowledge/actions";

const initialState: ArticleActionState = { error: null, success: null };

interface CategoryOption {
  id: string;
  name: string;
}

interface ArticleEditorFormProps {
  categories: CategoryOption[];
  mode: "create" | "edit";
  articleId?: string;
  defaults?: {
    title: string;
    excerpt: string;
    categoryId: string;
    tags: string;
    markdown: string;
    status: "draft" | "review" | "published";
    seoTitle: string;
    seoDescription: string;
  };
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden";

/** Form editor artikel dengan pratinjau render blok (markdown sederhana → blok JSONB). */
export function ArticleEditorForm({
  categories,
  mode,
  articleId,
  defaults,
}: ArticleEditorFormProps) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? actionCreateArticle : actionUpdateArticle,
    initialState,
  );
  const [markdown, setMarkdown] = useState(defaults?.markdown ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const preview = useMemo(() => (showPreview ? markdownToBlocks(markdown) : []), [showPreview, markdown]);

  return (
    <form action={formAction} className="space-y-5">
      {mode === "edit" ? <input type="hidden" name="articleId" value={articleId} /> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ink">
              Judul artikel *
            </label>
            <Input
              id="title"
              name="title"
              defaultValue={defaults?.title}
              required
              minLength={5}
              maxLength={200}
              placeholder="Contoh: Panduan Lengkap Bekerja dari Rumah"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="content" className="text-sm font-semibold text-ink">
                Isi artikel * <span className="font-normal text-ink-muted">(markdown sederhana)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
              >
                <Eye className="size-3.5" aria-hidden="true" />
                {showPreview ? "Tulis" : "Pratinjau"}
              </button>
            </div>

            {showPreview ? (
              <div
                aria-live="polite"
                className={cn(
                  "min-h-96 space-y-4 rounded-xl border border-slate-200 bg-surface-muted p-5 text-sm",
                  preview.length === 0 && "text-ink-muted",
                )}
              >
                {preview.length === 0
                  ? "Mulai menulis untuk melihat pratinjau..."
                  : preview.map((block, i) => {
                      if (block.type === "heading")
                        return block.level === 3 ? (
                          <h3 key={i} className="text-base font-bold text-ink">{block.text}</h3>
                        ) : (
                          <h2 key={i} className="text-lg font-extrabold text-ink">{block.text}</h2>
                        );
                      if (block.type === "code")
                        return (
                          <pre key={i} className="overflow-x-auto rounded-lg bg-slate-950 p-3.5 text-xs text-slate-100">
                            <code>{block.text}</code>
                          </pre>
                        );
                      if (block.type === "quote")
                        return (
                          <blockquote key={i} className="rounded-r-lg border-l-4 border-brand-500 bg-brand-50 px-4 py-2 italic text-brand-900">
                            {block.text}
                          </blockquote>
                        );
                      if (block.type === "list")
                        return (
                          <ul key={i} className="list-disc space-y-1 pl-5 text-ink-secondary">
                            {block.items.map((item, j) => (
                              <li key={j}>{item}</li>
                            ))}
                          </ul>
                        );
                      if (block.type === "image")
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={block.src} alt={block.alt ?? ""} className="rounded-lg border border-slate-200" />
                        );
                      return (
                        <p key={i} className="leading-relaxed text-ink-secondary">{block.text}</p>
                      );
                    })}
              </div>
            ) : (
              <textarea
                id="content"
                name="content"
                defaultValue={defaults?.markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                required
                minLength={50}
                rows={20}
                placeholder={"Tulis artikel di sini...\n\n## Judul bagian\n\nParagraf biasa.\n\n- Butir list\n- Butir lain\n\n> Kutipan\n\n```js\nconsole.log('kode');\n```"}
                className={cn(inputCls, "font-mono text-[13px] leading-relaxed")}
              />
            )}
            <p className="mt-1.5 text-xs text-ink-muted">
              Didukung: <code>## Judul</code>, <code>- list</code>, <code>&gt; kutipan</code>, blok kode{" "}
              <code>```</code>. Baris kosong memisahkan paragraf.
            </p>
          </div>
        </div>

        {/* Panel samping */}
        <div className="space-y-4">
          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">Publikasi</h2>
            <label htmlFor="status" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Status
            </label>
            <select id="status" name="status" defaultValue={defaults?.status ?? "draft"} className={inputCls}>
              <option value="draft">Draft: hanya kamu</option>
              <option value="review">Review: menunggu moderasi</option>
              <option value="published">Terbitkan langsung</option>
            </select>
            <p className="mt-2 text-xs text-ink-muted">
              Artikel review diperiksa moderator sebelum tayang.
            </p>
          </div>

          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">Kategori &amp; tag</h2>
            <label htmlFor="categoryId" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Kategori
            </label>
            <select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""} className={inputCls}>
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label htmlFor="tags" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Tag <span className="font-normal">(pisahkan dengan koma, maks. 8)</span>
            </label>
            <Input
              id="tags"
              name="tags"
              defaultValue={defaults?.tags}
              placeholder="karier, produktivitas, tips"
            />
          </div>

          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">Ringkasan &amp; SEO</h2>
            <label htmlFor="excerpt" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Ringkasan (maks. 500 karakter)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              defaultValue={defaults?.excerpt}
              rows={3}
              maxLength={500}
              className={inputCls}
            />
            <label htmlFor="seoTitle" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Judul SEO (opsional)
            </label>
            <Input id="seoTitle" name="seoTitle" defaultValue={defaults?.seoTitle} maxLength={200} />
            <label htmlFor="seoDescription" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Deskripsi SEO (opsional)
            </label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              defaultValue={defaults?.seoDescription}
              rows={2}
              maxLength={300}
              className={inputCls}
            />
          </div>

          {state.error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
              {state.success}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Menyimpan..." : mode === "create" ? "Simpan Artikel" : "Simpan Perubahan"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/artikel">Batal</Link>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
