"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/modules/tools/components/copy-button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

const PALETTE_STORAGE_KEY = "rk-palette-v1";
const MAX_PALETTE_SIZE = 12;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Normalisasi input HEX 3 atau 6 digit (dengan/tanpa "#") menjadi "#rrggbb". */
function normalizeHexInput(raw: string): string | null {
  const value = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    const expanded = value
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value.toLowerCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

/** Konversi RGB → HSL dengan rumus standar. */
function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rn) {
      h = (gn - bn) / delta + (gn < bn ? 6 : 0);
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Luminansi relatif WCAG untuk menentukan warna teks yang lebih terbaca. */
function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function FormatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-surface-muted px-3.5 py-2.5">
      <span className="w-10 shrink-0 text-xs font-bold text-ink-muted">
        {label}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-sm text-ink">{value}</code>
      <CopyButton value={value} className="shrink-0" />
    </div>
  );
}

export default function ColorPicker() {
  const [hex, setHex] = useState("#3730a3");
  const [draft, setDraft] = useState("#3730a3");
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Muat palet tersimpan dari localStorage sekali saat mount (aman untuk SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Hidrasi dari localStorage hanya bisa terjadi di effect (SSR-safe).
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPalette(
            parsed
              .filter((item): item is string => typeof item === "string")
              .filter((item) => normalizeHexInput(item) !== null)
              .slice(0, MAX_PALETTE_SIZE),
          );
        }
      }
    } catch {
      // Data rusak atau JSON tidak valid — mulai dengan palet kosong.
    }
    setHydrated(true);
  }, []);

  // Simpan setiap perubahan setelah data awal selesai dimuat.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palette));
    } catch {
      // Penyimpanan lokal bisa jadi penuh atau diblokir browser.
    }
  }, [palette, hydrated]);

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const suggestWhiteText = useMemo(() => {
    const luminance = relativeLuminance(rgb);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / 0.05;
    return contrastWithWhite >= contrastWithBlack;
  }, [rgb]);

  function applyColor(value: string) {
    setHex(value);
    setDraft(value);
    setError(null);
  }

  function handleColorInputChange(value: string) {
    applyColor(value.toLowerCase());
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    const normalized = normalizeHexInput(value);
    if (normalized) {
      setHex(normalized);
      setError(null);
    }
  }

  function handleDraftBlur() {
    const normalized = normalizeHexInput(draft);
    if (normalized) {
      applyColor(normalized);
      return;
    }
    if (draft.trim() !== "") {
      setError("Format HEX tidak valid. Gunakan 3 atau 6 digit, mis. #1e40af atau f40.");
    }
  }

  function handleSaveToPalette() {
    if (palette.includes(hex)) {
      setNote("Warna ini sudah ada di palet.");
      return;
    }
    if (palette.length >= MAX_PALETTE_SIZE) {
      setNote(`Palet penuh. Hapus salah satu warna (maksimal ${MAX_PALETTE_SIZE}).`);
      return;
    }
    setPalette((prev) => [...prev, hex]);
    setNote(null);
  }

  function handleRemoveFromPalette(value: string) {
    setPalette((prev) => prev.filter((color) => color !== value));
    setNote(null);
  }

  return (
    <div className="grid gap-6">
      <ToolPanel title="Pilih warna">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <ToolLabel htmlFor="warna-terpilih">Pemilih warna</ToolLabel>
            <input
              id="warna-terpilih"
              type="color"
              value={hex}
              onChange={(event) => handleColorInputChange(event.target.value)}
              className="h-11 w-20 cursor-pointer rounded-xl border border-slate-200 bg-surface p-1 transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <ToolLabel htmlFor="kode-hex" hint="3 atau 6 digit">
              Kode HEX
            </ToolLabel>
            <Input
              id="kode-hex"
              value={draft}
              placeholder="#1e40af"
              error={error}
              onChange={(event) => handleDraftChange(event.target.value)}
              onBlur={handleDraftBlur}
            />
          </div>
        </div>

        <div
          className="mt-4 flex h-32 items-center justify-center rounded-xl border border-slate-200/80"
          style={{ backgroundColor: hex }}
        >
          <span
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold",
              suggestWhiteText ? "bg-black/25 text-white" : "bg-white/60 text-slate-900",
            )}
          >
            {suggestWhiteText ? "Teks putih lebih terbaca" : "Teks hitam lebih terbaca"}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <FormatRow label="HEX" value={hex} />
          <FormatRow label="RGB" value={rgbText} />
          <FormatRow label="HSL" value={hslText} />
        </div>
      </ToolPanel>

      <ToolPanel title="Palet warna">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-secondary">
            {palette.length}/{MAX_PALETTE_SIZE} warna tersimpan
          </p>
          <Button size="sm" onClick={handleSaveToPalette}>
            Simpan ke palet
          </Button>
        </div>

        {note ? <p className="mt-3 text-xs text-amber-700">{note}</p> : null}

        {palette.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
            Palet masih kosong. Simpan warna favorit Anda agar mudah dibandingkan.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            {palette.map((color) => (
              <div key={color} className="relative">
                <button
                  type="button"
                  onClick={() => applyColor(color)}
                  aria-label={`Pilih warna ${color}`}
                  title={color}
                  className="h-12 w-full rounded-lg border border-slate-200/80 shadow-xs transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFromPalette(color)}
                  aria-label={`Hapus warna ${color} dari palet`}
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-slate-200 bg-surface text-ink-muted shadow-xs transition-colors hover:text-red-600"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ToolPanel>
    </div>
  );
}
