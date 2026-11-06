"use client";

import { useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/modules/tools/components/copy-button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";
const AMBIGUOUS = new Set(["i", "l", "1", "L", "o", "0", "O"]);

interface PasswordOptions {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
  length: number;
}

/** Bilangan acak [0, max) tanpa modulo bias memakai rejection sampling. */
function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

function buildPassword(options: PasswordOptions): string {
  const sets: string[] = [];
  const pick = (set: string) => {
    const filtered = options.avoidAmbiguous
      ? [...set].filter((c) => !AMBIGUOUS.has(c)).join("")
      : set;
    if (filtered.length > 0) sets.push(filtered);
  };

  if (options.upper) pick(UPPER);
  if (options.lower) pick(LOWER);
  if (options.digits) pick(DIGITS);
  if (options.symbols) pick(SYMBOLS);

  const pool = sets.join("");
  if (pool.length === 0) return "";

  let password = "";
  for (let i = 0; i < options.length; i += 1) {
    password += pool[randomInt(pool.length)];
  }
  return password;
}

interface Strength {
  label: string;
  barClass: string;
  textClass: string;
  widthPercent: number;
}

function getStrength(entropy: number): Strength {
  if (entropy < 40) {
    return { label: "Lemah", barClass: "bg-red-500", textClass: "text-red-600", widthPercent: 25 };
  }
  if (entropy < 60) {
    return { label: "Cukup", barClass: "bg-amber-500", textClass: "text-amber-600", widthPercent: 50 };
  }
  if (entropy < 80) {
    return {
      label: "Kuat",
      barClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      widthPercent: 75,
    };
  }
  return {
    label: "Sangat Kuat",
    barClass: "bg-emerald-600",
    textClass: "text-emerald-700 font-bold",
    widthPercent: 100,
  };
}

const CHECKBOX_LABELS = {
  upper: "Huruf besar (A–Z)",
  lower: "Huruf kecil (a–z)",
  digits: "Angka (0–9)",
  symbols: "Simbol (!@#$%...)",
} as const;

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [password, setPassword] = useState("");

  const poolSize = useMemo(() => {
    let size = 0;
    if (upper) size += UPPER.length;
    if (lower) size += LOWER.length;
    if (digits) size += DIGITS.length;
    if (symbols) size += SYMBOLS.length;
    if (avoidAmbiguous) {
      // Kurangi perkiraan jumlah karakter yang tersaring.
      size = Math.max(size - AMBIGUOUS.size, 0);
    }
    return size;
  }, [upper, lower, digits, symbols, avoidAmbiguous]);

  const hasAnySet = poolSize > 0;
  const entropy = hasAnySet ? length * Math.log2(poolSize) : 0;
  const strength = getStrength(entropy);

  const regenerate = useCallback(() => {
    setPassword(
      buildPassword({ upper, lower, digits, symbols, avoidAmbiguous, length }),
    );
  }, [upper, lower, digits, symbols, avoidAmbiguous, length]);

  // Password hanya dibuat saat pengguna menekan tombol — tanpa efek, agar
  // tidak ada setState dalam effect dan tidak ada nilai rahasia di SSR.

  return (
    <ToolPanel>
      {/* Hasil */}
      <ToolLabel htmlFor="password-output" hint={hasAnySet ? `Kekuatan: ${strength.label}` : undefined}>
        Password Anda
      </ToolLabel>
      <div className="flex gap-2">
        <Input
          id="password-output"
          readOnly
          value={password}
          placeholder={hasAnySet ? undefined : "Pilih minimal satu jenis karakter"}
          className="font-mono"
          aria-live="polite"
          spellCheck={false}
        />
        <CopyButton value={password} className="h-11 shrink-0 px-3" />
        <Button
          variant="secondary"
          onClick={regenerate}
          disabled={!hasAnySet}
          aria-label={password ? "Buat password baru" : "Buat password"}
          className="shrink-0"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {password ? "Ulangi" : "Buat"}
        </Button>
      </div>

      {/* Meter kekuatan */}
      <div className="mt-4" aria-live="polite">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn("h-full rounded-full transition-all", strength.barClass)}
            style={{ width: hasAnySet ? `${strength.widthPercent}%` : "0%" }}
          />
        </div>
        <p className={cn("mt-1.5 text-xs", strength.textClass)}>
          {hasAnySet
            ? `${strength.label} — entropi ±${Math.round(entropy)} bit`
            : "Pilih minimal satu jenis karakter untuk membuat password."}
        </p>
      </div>

      {/* Panjang */}
      <div className="mt-6">
        <ToolLabel htmlFor="password-length" hint={`${length} karakter`}>
          Panjang password
        </ToolLabel>
        <input
          id="password-length"
          type="range"
          min={8}
          max={64}
          step={1}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-muted" aria-hidden="true">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      {/* Jenis karakter */}
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-ink">Jenis karakter</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { label: CHECKBOX_LABELS.upper, checked: upper, onChange: setUpper },
              { label: CHECKBOX_LABELS.lower, checked: lower, onChange: setLower },
              { label: CHECKBOX_LABELS.digits, checked: digits, onChange: setDigits },
              { label: CHECKBOX_LABELS.symbols, checked: symbols, onChange: setSymbols },
            ] as const
          ).map((item) => (
            <label
              key={item.label}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                className="size-4 accent-brand-600"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Karakter ambigu */}
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted">
        <input
          type="checkbox"
          checked={avoidAmbiguous}
          onChange={(e) => setAvoidAmbiguous(e.target.checked)}
          className="size-4 accent-brand-600"
        />
        Hindari karakter ambigu (il1Lo0O)
      </label>
    </ToolPanel>
  );
}
