"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToolPanel } from "@/modules/tools/components/tool-shell";

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB
const OUTPUT_FILENAME = "gabungan-ruangkumpul.pdf";

interface PdfEntry {
  id: string;
  file: File;
}

const sizeFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${sizeFormatter.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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

export default function PdfMerge() {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleAddFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const nextErrors: string[] = [];
    const accepted: File[] = [];

    for (const file of Array.from(list)) {
      if (!isPdfFile(file)) {
        nextErrors.push(`"${file.name}" dilewati karena bukan file PDF.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) {
      setErrors(nextErrors);
      return;
    }

    const countAfter = entries.length + accepted.length;
    if (countAfter > MAX_FILES) {
      nextErrors.push(
        `Batas ${MAX_FILES} file terlampaui (total menjadi ${countAfter} file). Tidak ada file baru yang ditambahkan.`,
      );
      setErrors(nextErrors);
      return;
    }

    const totalAfter =
      entries.reduce((sum, entry) => sum + entry.file.size, 0) +
      accepted.reduce((sum, file) => sum + file.size, 0);
    if (totalAfter > MAX_TOTAL_BYTES) {
      nextErrors.push(
        `Total ukuran ${formatBytes(totalAfter)} melebihi batas 50 MB. Tidak ada file baru yang ditambahkan.`,
      );
      setErrors(nextErrors);
      return;
    }

    setEntries((prev) => [...prev, ...accepted.map((file) => ({ id: createId(), file }))]);
    setErrors(nextErrors);
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function handleMove(index: number, direction: -1 | 1) {
    setEntries((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const moved = next[index];
      const displaced = next[target];
      if (!moved || !displaced) return prev;
      next[index] = displaced;
      next[target] = moved;
      return next;
    });
  }

  async function handleMerge() {
    if (entries.length < 2) {
      setMergeError("Pilih minimal 2 file PDF untuk digabungkan.");
      return;
    }
    setBusy(true);
    setMergeError(null);
    try {
      const output = await PDFDocument.create();
      const failedFiles: string[] = [];

      for (const entry of entries) {
        try {
          const bytes = await entry.file.arrayBuffer();
          const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await output.copyPages(source, source.getPageIndices());
          pages.forEach((page) => output.addPage(page));
        } catch {
          failedFiles.push(entry.file.name);
        }
      }

      if (failedFiles.length > 0) {
        setMergeError(
          `Gagal memuat file: ${failedFiles.join(", ")}. Pastikan PDF tidak rusak dan tidak terkunci password.`,
        );
        return;
      }

      const pdfBytes = await output.save();
      // Salin ke Uint8Array<ArrayBuffer> agar valid sebagai BlobPart.
      downloadBlob(
        new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
        OUTPUT_FILENAME,
      );
    } catch (err) {
      setMergeError(
        err instanceof Error
          ? `Terjadi kesalahan saat menggabungkan: ${err.message}`
          : "Terjadi kesalahan saat menggabungkan PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolPanel title="Gabungkan PDF">
      <label className={buttonVariants({ variant: "primary", size: "sm" })}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(event) => {
            handleAddFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Plus className="size-4" aria-hidden="true" />
        Pilih file PDF
      </label>
      <p className="mt-2 text-xs text-ink-muted">
        Maksimal {MAX_FILES} file, total 50 MB. Semua diproses di browser Anda.
      </p>

      {errors.length > 0 ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <ul className="list-disc space-y-1 pl-4">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
          Belum ada file. Pilih dua file PDF atau lebih untuk digabungkan.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-surface-muted px-3 py-2"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {entry.file.name}
                </span>
                <span className="text-xs text-ink-muted">{formatBytes(entry.file.size)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  aria-label={`Naikkan urutan ${entry.file.name}`}
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === entries.length - 1}
                  aria-label={`Turunkan urutan ${entry.file.name}`}
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(entry.id)}
                  aria-label={`Hapus ${entry.file.name}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {mergeError ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {mergeError}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => void handleMerge()} disabled={busy || entries.length < 2}>
          {busy ? "Menggabungkan..." : "Gabungkan PDF"}
        </Button>
        {entries.length < 2 && !busy ? (
          <p className="text-xs text-ink-muted">Pilih minimal 2 file untuk menggabungkan.</p>
        ) : null}
      </div>
    </ToolPanel>
  );
}
