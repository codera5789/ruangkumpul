"use client";

import { useId, useMemo, useState } from "react";
import { Copy, Check, Code, Eye, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";
import { parseMarkdownToHtml } from "@/modules/tools/components/tools/markdown-converter-parser";

const SAMPLE_MARKDOWN = `# Judul Artikel

Ini adalah contoh paragraf dengan teks **tebal**, teks *miring*, dan \`inline code\`.

## Sub Judul

Daftar keunggulan:
- Cepat dan tanpa reload server
- 100% diproses di browser klien
- Privasi aman tanpa pengiriman data

Kutipan penting:
> "Satu ruang untuk tools, ilmu, dan komunitas."

### Blok Kode

\`\`\`javascript
function sapa(nama) {
  return "Halo, " + nama + "!";
}
\`\`\`

Kunjungi [RuangKumpul](https://ruangkumpul.my.id) untuk tools gratis lainnya.
`;

export default function MarkdownConverter() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [activeTab, setActiveTab] = useState<"preview" | "html">("preview");
  const [copied, setCopied] = useState(false);
  const textareaId = useId();

  const htmlOutput = useMemo(() => parseMarkdownToHtml(markdown), [markdown]);

  const stats = useMemo(() => {
    const chars = markdown.length;
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const lines = markdown ? markdown.split("\n").length : 0;
    return { chars, words, lines };
  }, [markdown]);

  const handleCopy = async () => {
    if (!htmlOutput) return;
    try {
      await navigator.clipboard.writeText(htmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback peramban
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kolom Editor Markdown */}
        <ToolPanel className="flex flex-col">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <ToolLabel htmlFor={textareaId}>Editor Markdown</ToolLabel>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
                className="h-8 px-2 text-xs text-ink-muted hover:text-ink"
              >
                <RefreshCw className="mr-1 size-3" aria-hidden="true" />
                Contoh
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMarkdown("")}
                className="h-8 px-2 text-xs text-ink-muted hover:text-red-600"
              >
                <Trash2 className="mr-1 size-3" aria-hidden="true" />
                Hapus
              </Button>
            </div>
          </div>

          <textarea
            id={textareaId}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Tulis atau tempel teks Markdown di sini..."
            rows={18}
            className="w-full flex-1 resize-y rounded-xl border border-slate-200 bg-surface p-3.5 font-mono text-sm leading-relaxed text-ink focus:border-brand-500 focus:outline-hidden"
          />

          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
            <span>{stats.words} kata · {stats.chars} karakter · {stats.lines} baris</span>
          </div>
        </ToolPanel>

        {/* Kolom Hasil & Pratinjau */}
        <ToolPanel className="flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1 rounded-lg bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTab === "preview"
                    ? "bg-surface text-brand-800 shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                Pratinjau Tampilan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("html")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTab === "html"
                    ? "bg-surface text-brand-800 shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Code className="size-3.5" aria-hidden="true" />
                Kode HTML
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!htmlOutput}
              className="h-8 gap-1 px-3 text-xs"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Salin HTML
                </>
              )}
            </Button>
          </div>

          <div className="min-h-[400px] flex-1 overflow-auto rounded-xl border border-slate-200 bg-surface p-4 text-sm leading-relaxed text-ink">
            {activeTab === "preview" ? (
              htmlOutput ? (
                <div
                  className="prose max-w-none text-ink [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink-secondary [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre_code]:bg-transparent [&_a]:text-brand-700 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: htmlOutput }}
                />
              ) : (
                <p className="py-12 text-center text-sm text-ink-muted">
                  Pratinjau tampilan akan muncul di sini.
                </p>
              )
            ) : (
              <pre className="overflow-x-auto font-mono text-xs text-ink-secondary">
                <code>{htmlOutput || "<!-- Kode HTML akan muncul di sini -->"}</code>
              </pre>
            )}
          </div>
        </ToolPanel>
      </div>
    </div>
  );
}
