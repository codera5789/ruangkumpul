"use client";

import { Download, ImageDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"] as const;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_SIDE_PX = 4096;
const QUALITY_DEBOUNCE_MS = 350;

interface CompressionResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

const sizeFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const numberFormatter = new Intl.NumberFormat("id-ID");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${sizeFormatter.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

function isAcceptedType(file: File): boolean {
  if ((ACCEPTED_TYPES as readonly string[]).includes(file.type)) return true;
  // Sebagian perangkat mengirim type kosong — izinkan berdasarkan ekstensi.
  return /\.(jpe?g|png)$/i.test(file.name);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar. File mungkin rusak."));
    image.src = url;
  });
}

export default function ImageCompressor() {
  const [quality, setQuality] = useState(75);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const sourceRef = useRef<File | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const compressTokenRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan URL objek dan timer saat unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }

  async function compressFile(file: File, qualityPercent: number) {
    const token = ++compressTokenRef.current;
    setBusy(true);
    setError(null);
    let sourceUrl: string | null = null;
    try {
      sourceUrl = URL.createObjectURL(file);
      const image = await loadImage(sourceUrl);
      // Pertahankan dimensi asli, dengan batas 4096 px pada sisi terpanjang.
      const scale = Math.min(
        1,
        MAX_SIDE_PX / Math.max(image.naturalWidth, image.naturalHeight, 1),
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas API tidak didukung oleh browser ini.");
      // PNG transparan diisi latar putih agar tidak menjadi hitam saat jadi JPG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", qualityPercent / 100);
      });
      if (!blob) throw new Error("Gagal membuat file hasil kompresi.");
      if (token !== compressTokenRef.current) return; // Ada proses lebih baru — abaikan hasil lama.

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, width, height });
    } catch (err) {
      if (token === compressTokenRef.current) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan saat mengompres gambar.",
        );
      }
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (token === compressTokenRef.current) setBusy(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!isAcceptedType(file)) {
      clearResult();
      setSourceFile(null);
      sourceRef.current = null;
      setError("Format file tidak didukung. Gunakan gambar JPG atau PNG.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      clearResult();
      setSourceFile(null);
      sourceRef.current = null;
      setError(`Ukuran file ${formatBytes(file.size)} melebihi batas maksimal 20 MB.`);
      return;
    }
    setError(null);
    clearResult();
    setSourceFile(file);
    sourceRef.current = file;
    void compressFile(file, quality);
  }

  function handleQualityChange(value: number) {
    setQuality(value);
    const file = sourceRef.current;
    if (!file) return;
    // Debounce agar canvas tidak diproses pada setiap gerakan slider.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void compressFile(file, value);
    }, QUALITY_DEBOUNCE_MS);
  }

  function handleDownload() {
    if (!result || !sourceFile) return;
    const baseName = sourceFile.name.replace(/\.[^.]+$/, "") || "gambar";
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = `${baseName}-min.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const savingsPct =
    sourceFile && result ? ((sourceFile.size - result.blob.size) / sourceFile.size) * 100 : 0;

  return (
    <div className="grid gap-6">
      <ToolPanel title="Pilih gambar">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-surface-muted",
          )}
        >
          <ImageDown className="size-8 text-ink-muted" aria-hidden="true" />
          <p className="text-sm text-ink-secondary">
            Seret &amp; letakkan gambar di sini, atau pilih dari perangkat Anda.
          </p>
          <label className={buttonVariants({ variant: "primary", size: "sm" })}>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            Pilih gambar
          </label>
          <p className="text-xs text-ink-muted">JPG atau PNG, maksimal 20 MB.</p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <ToolLabel htmlFor="kualitas-kompresi" hint={`${quality}%`}>
            Kualitas kompresi
          </ToolLabel>
          <input
            id="kualitas-kompresi"
            type="range"
            min={10}
            max={100}
            step={1}
            value={quality}
            onChange={(event) => handleQualityChange(Number(event.target.value))}
            className="w-full cursor-pointer accent-brand-800"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span>10% (paling kecil)</span>
            <span>100% (paling baik)</span>
          </div>
        </div>
      </ToolPanel>

      {sourceFile && result ? (
        <ToolPanel title="Hasil kompresi">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* URL blob hasil kompresi tidak dapat dioptimalkan next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={`Pratinjau hasil kompresi ${sourceFile.name}`}
              className="size-24 shrink-0 rounded-xl border border-slate-200/80 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{sourceFile.name}</p>
              <p className="text-xs text-ink-muted">
                Dimensi: {numberFormatter.format(result.width)} ×{" "}
                {numberFormatter.format(result.height)} px
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-surface-muted px-3.5 py-2.5">
                  <p className="text-xs text-ink-muted">Ukuran asli</p>
                  <p className="text-sm font-bold text-ink">{formatBytes(sourceFile.size)}</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-surface-muted px-3.5 py-2.5">
                  <p className="text-xs text-ink-muted">Ukuran hasil (.jpg)</p>
                  <p className="text-sm font-bold text-ink">{formatBytes(result.blob.size)}</p>
                </div>
              </div>
              {savingsPct >= 0 ? (
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  Penghematan: {percentFormatter.format(savingsPct)}%
                </p>
              ) : (
                <p className="mt-3 text-sm text-red-600">
                  Penghematan: {percentFormatter.format(savingsPct)}%, tidak efisien, coba
                  kualitas lebih rendah.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={handleDownload}>
              <Download className="size-4" aria-hidden="true" />
              Unduh hasil (.jpg)
            </Button>
            {busy ? <p className="text-sm text-ink-secondary">Memproses gambar...</p> : null}
          </div>
        </ToolPanel>
      ) : null}
    </div>
  );
}
