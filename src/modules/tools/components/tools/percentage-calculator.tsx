"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "dari" | "berapa-persen" | "perubahan";

const MODES: { value: Mode; label: string }[] = [
  { value: "dari", label: "X% dari Y" },
  { value: "berapa-persen", label: "X adalah berapa % dari Y" },
  { value: "perubahan", label: "Perubahan dari X ke Y" },
];

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Angka "" → null; teks tidak valid → NaN. */
function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  return Number(raw);
}

interface Computation {
  headline: string;
  detail: string;
  isError?: boolean;
}

function compute(mode: Mode, x: number | null, y: number | null): Computation | null {
  if (x === null || y === null) return null;
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return { headline: "Input tidak valid", detail: "Masukkan angka yang benar.", isError: true };
  }

  if (mode === "dari") {
    return {
      headline: formatNumber((x / 100) * y),
      detail: `${formatNumber(x)}% dari ${formatNumber(y)}`,
    };
  }

  if (mode === "berapa-persen") {
    if (y === 0) {
      return {
        headline: "Tidak terdefinisi",
        detail: "Pembagian dengan nol — nilai Y tidak boleh 0.",
        isError: true,
      };
    }
    return {
      headline: `${formatNumber((x / y) * 100)}%`,
      detail: `${formatNumber(x)} adalah berapa % dari ${formatNumber(y)}`,
    };
  }

  // mode === "perubahan"
  if (x === 0 || y === 0) {
    return {
      headline: "Tidak terdefinisi",
      detail: "Perubahan persen tidak dapat dihitung jika X atau Y bernilai 0.",
      isError: true,
    };
  }
  // Rumus sesuai FAQ tool: ((nilai baru − nilai lama) ÷ nilai lama) × 100%
  const change = ((y - x) / x) * 100;
  return {
    headline: `${change >= 0 ? "+" : ""}${formatNumber(change)}%`,
    detail: change >= 0 ? `Kenaikan dari ${formatNumber(x)} ke ${formatNumber(y)}` : `Penurunan dari ${formatNumber(x)} ke ${formatNumber(y)}`,
  };
}

const INPUT_LABELS: Record<Mode, { x: string; y: string }> = {
  dari: { x: "Persen (X)", y: "Nilai (Y)" },
  "berapa-persen": { x: "Nilai (X)", y: "Nilai pembanding (Y)" },
  perubahan: { x: "Nilai awal (X)", y: "Nilai baru (Y)" },
};

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("dari");
  const [rawX, setRawX] = useState("");
  const [rawY, setRawY] = useState("");

  const result = useMemo(() => {
    return compute(mode, parseNumber(rawX), parseNumber(rawY));
  }, [mode, rawX, rawY]);

  const labels = INPUT_LABELS[mode];

  return (
    <div className="space-y-5">
      {/* Tab mode */}
      <div
        role="tablist"
        aria-label="Jenis perhitungan persen"
        className="flex flex-wrap gap-2"
      >
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="tab"
            aria-selected={mode === m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
              mode === m.value
                ? "border-brand-200 bg-brand-50 text-brand-800"
                : "border-slate-200 bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="percent-x"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              {labels.x}
            </label>
            <input
              id="percent-x"
              type="number"
              step="any"
              value={rawX}
              onChange={(e) => setRawX(e.target.value)}
              placeholder="Contoh: 25"
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="percent-y"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              {labels.y}
            </label>
            <input
              id="percent-y"
              type="number"
              step="any"
              value={rawY}
              onChange={(e) => setRawY(e.target.value)}
              placeholder="Contoh: 120.000"
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Kartu hasil */}
        <div className="mt-5" aria-live="polite">
          {result ? (
            <div
              className={cn(
                "rounded-card px-4 py-5 sm:px-5",
                result.isError
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "bg-brand-50 text-brand-900",
              )}
            >
              <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
                {result.isError ? "Tidak dapat dihitung" : "Hasil"}
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {result.headline}
              </p>
              <p className="mt-1.5 text-sm opacity-80">{result.detail}</p>
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-slate-200 bg-surface-muted px-4 py-5 text-center text-sm text-ink-secondary">
              Masukkan kedua nilai untuk melihat hasilnya.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
