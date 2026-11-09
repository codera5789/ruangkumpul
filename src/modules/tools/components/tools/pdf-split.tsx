"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

type SplitMode = "rentang" | "halaman";

const MAX_PAGE_BUTTONS = 50;
const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_PAGES = 500;

interface LoadedPdf {
  name: string;
  size: number;
  pageCount: number;
  doc: PDFDocument;
}

const sizeFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${sizeFormatter.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function baseName(filename: string): string {
  return filename.replace(/\.pdf$/i, "") || "dokumen";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parse rentang halaman berformat "1-3, 5, 8-10" menjadi daftar nomor halaman.
 * Melempar Error berbahasa Indonesia bila format atau nilainya tidak valid.
 */
function parsePageRange(input: string, pageCount: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Rentang halaman tidak boleh kosong. Contoh: 1-3, 5, 8-10.");
  }

  const pages: number[] = [];
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) {
      throw new Error(`Format tidak valid: terdapat bagian kosong pada "${trimmed}".`);
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(segment);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start > end) {
        throw new Error(`Rentang tidak valid: "${segment}" (awal lebih besar dari akhir).`);
      }
      if (start < 1 || end > pageCount) {
        throw new Error(`Rentang "${segment}" berada di luar jumlah halaman (1-${pageCount}).`);
      }
      for (let page = start; page <= end; page += 1) {
        pages.push(page);
      }
    } else if (/^\d+$/.test(segment)) {
      const page = Number(segment);
      if (page < 1 || page > pageCount) {
        throw new Error(`Halaman ${segment} berada di luar jumlah halaman (1-${pageCount}).`);
      }
      pages.push(page);
    } else {
      throw new Error(`Format tidak dikenali: "${segment}". Gunakan format seperti 1-3, 5, 8-10.`);
    }
  }

  return Array.from(new Set(pages));
}

export default function PdfSplit() {
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<SplitMode>("rentang");
  const [rangeInput, setRangeInput] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!isPdfFile(file)) {
      setLoaded(null);
      setError("File bukan PDF. Pilih file dengan format .pdf.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setLoaded(null);
      setError("Ukuran PDF maksimal 50 MB agar browser tidak kehabisan memori.");
      return;
    }
    setLoadingDoc(true);
    setError(null);
    setRangeError(null);
    setRangeInput("");
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      if (doc.getPageCount() > MAX_PAGES) {
        setLoaded(null);
        setError(`PDF maksimal ${MAX_PAGES} halaman. Pecah file besar terlebih dahulu.`);
        return;
      }
      setLoaded({ name: file.name, size: file.size, pageCount: doc.getPageCount(), doc });
    } catch (err) {
      setLoaded(null);
      setError(
        err instanceof Error
          ? `Gagal memuat PDF: ${err.message}`
          : "Gagal memuat PDF. File mungkin rusak atau terproteksi.",
      );
    } finally {
      setLoadingDoc(false);
    }
  }

  async function extractPages(pageIndices: number[], filename: string) {
    const source = loaded;
    if (!source) {
      setError("Belum ada PDF yang dimuat.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const output = await PDFDocument.create();
      const copied = await output.copyPages(source.doc, pageIndices);
      copied.forEach((page) => output.addPage(page));
      const pdfBytes = await output.save();
      // Salin ke Uint8Array<ArrayBuffer> agar valid sebagai BlobPart.
      downloadBlob(
        new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
        filename,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `Gagal mengekstrak halaman: ${err.message}`
          : "Gagal mengekstrak halaman dari PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleExtractRange() {
    if (!loaded) return;
    try {
      const pages = parsePageRange(rangeInput, loaded.pageCount);
      setRangeError(null);
      void extractPages(
        pages.map((page) => page - 1),
        `ekstrak-${baseName(loaded.name)}.pdf`,
      );
    } catch (err) {
      setRangeError(err instanceof Error ? err.message : "Rentang halaman tidak valid.");
    }
  }

  function handleExtractSingle(page: number) {
    if (!loaded) return;
    void extractPages([page - 1], `${baseName(loaded.name)}-hal-${page}.pdf`);
  }

  const pagesToShow = loaded
    ? Array.from({ length: Math.min(loaded.pageCount, MAX_PAGE_BUTTONS) }, (_, i) => i + 1)
    : [];

  return (
    <div className="grid gap-6">
      <ToolPanel title="Pilih file PDF">
        <label className={buttonVariants({ variant: "primary", size: "sm" })}>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          Pilih file PDF
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          File diproses sepenuhnya di browser Anda, tidak diunggah ke server.
        </p>

        {loadingDoc ? (
          <p className="mt-4 text-sm text-ink-secondary">Memuat PDF...</p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {loaded && !loadingDoc ? (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-surface-muted px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{loaded.name}</p>
            <p className="text-xs text-ink-muted">
              {formatBytes(loaded.size)} • {loaded.pageCount} halaman
            </p>
          </div>
        ) : null}
      </ToolPanel>

      {loaded && !loadingDoc ? (
        <ToolPanel title="Mode pemisahan">
          <div className="inline-flex rounded-xl border border-slate-200 bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setMode("rentang")}
              aria-pressed={mode === "rentang"}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                mode === "rentang"
                  ? "bg-brand-800 text-white shadow-xs"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              Ekstrak rentang
            </button>
            <button
              type="button"
              onClick={() => setMode("halaman")}
              aria-pressed={mode === "halaman"}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                mode === "halaman"
                  ? "bg-brand-800 text-white shadow-xs"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              Pisah per halaman
            </button>
          </div>

          {mode === "rentang" ? (
            <div className="mt-4 grid gap-3">
              <div>
                <ToolLabel htmlFor="rentang-halaman" hint={`1-${loaded.pageCount}`}>
                  Rentang halaman
                </ToolLabel>
                <Input
                  id="rentang-halaman"
                  value={rangeInput}
                  placeholder="Contoh: 1-3, 5, 8-10"
                  error={rangeError}
                  onChange={(event) => {
                    setRangeInput(event.target.value);
                    if (rangeError) setRangeError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleExtractRange();
                    }
                  }}
                />
              </div>
              <div>
                <Button onClick={handleExtractRange} disabled={busy}>
                  {busy ? "Mengekstrak..." : "Ekstrak"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
                {pagesToShow.map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExtractSingle(page)}
                    disabled={busy}
                  >
                    Hal. {page}
                  </Button>
                ))}
              </div>
              {loaded.pageCount > MAX_PAGE_BUTTONS ? (
                <p className="text-xs text-ink-muted">
                  Menampilkan {MAX_PAGE_BUTTONS} halaman pertama dari {loaded.pageCount}. Gunakan
                  mode &quot;Ekstrak rentang&quot; untuk halaman selanjutnya.
                </p>
              ) : null}
            </div>
          )}
        </ToolPanel>
      ) : null}
    </div>
  );
}
