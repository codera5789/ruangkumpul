"use client";

import { useRef, useState } from "react";
import { Download, UploadCloud, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

interface IconSize {
  name: string;
  size: number;
  label: string;
  filename: string;
  dataUrl?: string;
}

const TARGET_SIZES: Omit<IconSize, "dataUrl">[] = [
  { name: "16x16", size: 16, label: "Favicon Klasik", filename: "favicon-16x16.png" },
  { name: "32x32", size: 32, label: "Favicon Tab Standar", filename: "favicon-32x32.png" },
  { name: "48x48", size: 48, label: "Ikon Shortcut", filename: "favicon-48x48.png" },
  { name: "180x180", size: 180, label: "Apple Touch Icon", filename: "apple-touch-icon.png" },
  { name: "192x192", size: 192, label: "Android Chrome PWA", filename: "android-chrome-192x192.png" },
  { name: "512x512", size: 512, label: "PWA Splash & Store", filename: "android-chrome-512x512.png" },
];

export default function FaviconGenerator() {
  const [generatedIcons, setGeneratedIcons] = useState<IconSize[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      processIcons(result);
    };
    reader.readAsDataURL(file);
  };

  const processIcons = (imgSrc: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const results: IconSize[] = TARGET_SIZES.map((target) => {
        const canvas = document.createElement("canvas");
        canvas.width = target.size;
        canvas.height = target.size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, target.size, target.size);
        }
        return {
          ...target,
          dataUrl: canvas.toDataURL("image/png"),
        };
      });
      setGeneratedIcons(results);
    };
    img.src = imgSrc;
  };

  const handleDownload = (icon: IconSize) => {
    if (!icon.dataUrl) return;
    const a = document.createElement("a");
    a.href = icon.dataUrl;
    a.download = icon.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const codeSnippet = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Unggah Gambar */}
      <ToolPanel>
        <ToolLabel>Unggah Logo atau Gambar Utama</ToolLabel>
        <p className="mb-4 text-xs text-ink-muted">
          Pilih gambar beresolusi tinggi (disarankan persegi minimal 512x512 px) format PNG, JPG, atau SVG.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-surface-muted/50 p-8 text-center transition-colors hover:border-brand-500 hover:bg-surface-muted"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <UploadCloud className="size-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">
            Klik untuk memilih file atau tarik file ke area ini
          </p>
          <p className="mt-1 text-xs text-ink-muted">PNG, JPG, SVG, WebP hingga 10MB</p>
        </div>
      </ToolPanel>

      {/* Panel Hasil Ukuran Ikon */}
      {generatedIcons.length > 0 ? (
        <ToolPanel title="Paket Favicon yang Dihasilkan">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generatedIcons.map((icon) => (
              <div
                key={icon.name}
                className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-surface p-3.5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-1">
                  {icon.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon.dataUrl}
                      alt={icon.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{icon.name}</p>
                  <p className="truncate text-xs text-ink-muted">{icon.label}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(icon)}
                  className="h-8 shrink-0 px-2.5 text-xs"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Unduh
                </Button>
              </div>
            ))}
          </div>

          {/* Snippet HTML */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-secondary">
                Kode HTML Tag Link
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-7 gap-1 px-2 text-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="size-3 text-emerald-600" aria-hidden="true" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="size-3" aria-hidden="true" />
                    Salin Kode
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </ToolPanel>
      ) : null}
    </div>
  );
}
