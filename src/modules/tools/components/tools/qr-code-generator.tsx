"use client";

import QRCode from "qrcode";
import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

type ErrorLevel = "L" | "M" | "Q" | "H";

const SIZE_OPTIONS = [256, 512, 1024] as const;

const LEVEL_OPTIONS: { value: ErrorLevel; label: string }[] = [
  { value: "L", label: "L: Rendah (±7%)" },
  { value: "M", label: "M: Sedang (±15%)" },
  { value: "Q", label: "Q: Kuat (±25%)" },
  { value: "H", label: "H: Sangat kuat (±30%)" },
];

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden";

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState<number>(512);
  const [level, setLevel] = useState<ErrorLevel>("M");
  const [generating, setGenerating] = useState(false);
  const [hasQr, setHasQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canGenerate = text.trim().length > 0 && !generating;

  async function handleGenerate() {
    const canvas = canvasRef.current;
    const value = text.trim();
    if (!canvas || value === "" || generating) return;

    setGenerating(true);
    setError(null);
    try {
      await QRCode.toCanvas(canvas, value, {
        width: size,
        errorCorrectionLevel: level,
        margin: 2,
      });
      setHasQr(true);
    } catch (err) {
      setHasQr(false);
      setError(
        err instanceof Error
          ? `Gagal membuat QR code: ${err.message}`
          : "Gagal membuat QR code. Coba perpendek teks yang dimasukkan.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !hasQr) return;
    try {
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setError("Unduhan gagal. Coba klik kanan pada gambar QR lalu pilih simpan gambar.");
    }
  }

  return (
    <ToolPanel>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kolom input */}
        <div>
          <ToolLabel htmlFor="qr-text">Teks atau URL</ToolLabel>
          <Input
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: https://ruangkumpul.id"
            spellCheck={false}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <ToolLabel htmlFor="qr-size">Ukuran (px)</ToolLabel>
              <select
                id="qr-size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={SELECT_CLASS}
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} px
                  </option>
                ))}
              </select>
            </div>
            <div>
              <ToolLabel htmlFor="qr-level">Koreksi error</ToolLabel>
              <select
                id="qr-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as ErrorLevel)}
                className={SELECT_CLASS}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={handleGenerate} disabled={!canGenerate}>
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Membuat...
                </>
              ) : (
                "Buat QR Code"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!hasQr || generating}
            >
              <Download className="size-4" aria-hidden="true" />
              Unduh PNG
            </Button>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}
        </div>

        {/* Kolom preview */}
        <div className="flex items-start justify-center">
          <div
            className={cn(
              "flex min-h-64 w-full max-w-xs items-center justify-center rounded-card border border-dashed border-slate-200 bg-surface-muted p-4",
              hasQr && "border-solid border-slate-200/80 bg-surface shadow-card",
            )}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Preview QR code"
              className={cn("h-auto w-full max-w-full rounded-lg", !hasQr && "hidden")}
            />
            {!hasQr ? (
              <p className="py-12 text-center text-sm text-ink-secondary">
                QR code akan tampil di sini setelah dibuat.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </ToolPanel>
  );
}
