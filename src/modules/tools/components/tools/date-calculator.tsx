"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

type Mode = "selisih" | "tambah";
type Unit = "hari" | "minggu" | "bulan";
type Direction = "tambah" | "kurang";

const MODES: { value: Mode; label: string }[] = [
  { value: "selisih", label: "Selisih dua tanggal" },
  { value: "tambah", label: "Tambah / kurangi hari" },
];

const UNITS: { value: Unit; label: string }[] = [
  { value: "hari", label: "Hari" },
  { value: "minggu", label: "Minggu" },
  { value: "bulan", label: "Bulan" },
];

const DAY_MS = 86_400_000;

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("id-ID");

interface DateParts {
  year: number;
  month: number; // 0-based
  day: number;
}

/** Parse "YYYY-MM-DD" dari input date tanpa pergeseran zona waktu. */
function parseDateParts(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function toUtcMillis(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month, parts.day);
}

function toUtcDate(parts: DateParts): Date {
  return new Date(toUtcMillis(parts));
}

function formatPartsId(parts: DateParts): string {
  return longDateFormatter.format(toUtcDate(parts));
}

/** Jumlah hari dalam rentang inklusif yang jatuh pada weekday tertentu (O(1), tanpa loop). */
function countWeekday(startDayOfWeek: number, totalDays: number, target: number): number {
  const first = (target - startDayOfWeek + 7) % 7;
  if (first >= totalDays) return 0;
  return Math.floor((totalDays - 1 - first) / 7) + 1;
}

interface DifferenceResult {
  totalDays: number;
  weeks: number;
  remainingDays: number;
  months: number;
  saturdays: number;
  sundays: number;
  earlier: DateParts;
  later: DateParts;
}

function computeDifference(a: DateParts, b: DateParts): DifferenceResult {
  const [earlier, later] =
    toUtcMillis(a) <= toUtcMillis(b) ? [a, b] : [b, a];

  const totalDays = Math.round((toUtcMillis(later) - toUtcMillis(earlier)) / DAY_MS);
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  let months = (later.year - earlier.year) * 12 + (later.month - earlier.month);
  if (later.day < earlier.day) months -= 1;

  // Rentang inklusif: diff + 1 hari, dihitung dari hari kerja tanggal awal.
  const startDayOfWeek = toUtcDate(earlier).getUTCDay();
  const inclusiveDays = totalDays + 1;
  const saturdays = countWeekday(startDayOfWeek, inclusiveDays, 6);
  const sundays = countWeekday(startDayOfWeek, inclusiveDays, 0);

  return { totalDays, weeks, remainingDays, months, saturdays, sundays, earlier, later };
}

/** Tambah/kurangi hari atau minggu; bulan di-clamp ke akhir bulan tujuan (31 Jan + 1 bln → 28/29 Feb). */
function shiftDate(base: DateParts, amount: number, unit: Unit, direction: Direction): Date {
  const sign = direction === "tambah" ? 1 : -1;
  const result = toUtcDate(base);
  if (unit === "hari") {
    result.setUTCDate(result.getUTCDate() + sign * amount);
    return result;
  }
  if (unit === "minggu") {
    result.setUTCDate(result.getUTCDate() + sign * amount * 7);
    return result;
  }
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + sign * amount);
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTargetMonth));
  return result;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-slate-200/80 bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-ink-secondary">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

const DATE_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden";

export default function DateCalculator() {
  const [mode, setMode] = useState<Mode>("selisih");

  // Mode selisih
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");

  // Mode tambah/kurang
  const [baseValue, setBaseValue] = useState("");
  const [amountRaw, setAmountRaw] = useState("7");
  const [unit, setUnit] = useState<Unit>("hari");
  const [direction, setDirection] = useState<Direction>("tambah");

  const difference = useMemo(() => {
    if (startValue === "" || endValue === "") return null;
    const start = parseDateParts(startValue);
    const end = parseDateParts(endValue);
    if (!start || !end) return null;
    return computeDifference(start, end);
  }, [startValue, endValue]);

  const shifted = useMemo(() => {
    if (baseValue === "") return null;
    const base = parseDateParts(baseValue);
    if (!base) return null;
    const amount = Number(amountRaw);
    if (!Number.isInteger(amount) || amount < 0) return null;
    return { base, amount, result: shiftDate(base, amount, unit, direction) };
  }, [baseValue, amountRaw, unit, direction]);

  const amountInvalid =
    baseValue !== "" && (!Number.isInteger(Number(amountRaw)) || Number(amountRaw) < 0);

  return (
    <ToolPanel>
      {/* Toggle mode */}
      <div
        role="tablist"
        aria-label="Mode kalkulator tanggal"
        className="mb-5 flex flex-wrap gap-2"
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

      {mode === "selisih" ? (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ToolLabel htmlFor="date-start">Tanggal mulai</ToolLabel>
              <input
                id="date-start"
                type="date"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className={DATE_INPUT_CLASS}
              />
            </div>
            <div>
              <ToolLabel htmlFor="date-end">Tanggal akhir</ToolLabel>
              <input
                id="date-end"
                type="date"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                className={DATE_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="mt-5" aria-live="polite">
            {difference ? (
              <div className="space-y-3">
                <div className="rounded-card bg-brand-50 px-4 py-5 text-brand-900 sm:px-5">
                  <p className="text-xs font-semibold opacity-80">
                    Selisih
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {numberFormatter.format(difference.totalDays)} hari
                  </p>
                  <p className="mt-1.5 text-sm opacity-80">
                    {numberFormatter.format(difference.weeks)} minggu{" "}
                    {difference.remainingDays > 0
                      ? `${numberFormatter.format(difference.remainingDays)} hari`
                      : "persis"}{" "}
                   , sekitar {numberFormatter.format(difference.months)} bulan
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard
                    label="Akhir pekan"
                    value={`${numberFormatter.format(difference.saturdays + difference.sundays)} hari`}
                    hint={`Sabtu: ${numberFormatter.format(difference.saturdays)}, Minggu: ${numberFormatter.format(difference.sundays)}`}
                  />
                  <StatCard
                    label="Rentang"
                    value={formatPartsId(difference.earlier)}
                    hint={`sampai ${formatPartsId(difference.later)}`}
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-surface-muted px-3.5 py-3 text-center text-sm text-ink-secondary">
                Isi kedua tanggal untuk melihat selisihnya. Urutan tanggal bebas: kami
                otomatis mengurutkannya.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <ToolLabel htmlFor="date-base">Tanggal dasar</ToolLabel>
              <input
                id="date-base"
                type="date"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                className={DATE_INPUT_CLASS}
              />
            </div>
            <div>
              <ToolLabel htmlFor="date-amount">Jumlah</ToolLabel>
              <input
                id="date-amount"
                type="number"
                step={1}
                min={0}
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                className={cn(
                  DATE_INPUT_CLASS,
                  amountInvalid && "border-red-400 focus:border-red-500",
                )}
                aria-invalid={amountInvalid || undefined}
              />
            </div>
            <div>
              <ToolLabel htmlFor="date-unit">Satuan</ToolLabel>
              <select
                id="date-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className={DATE_INPUT_CLASS}
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Arah */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Arah pergeseran">
            {(["tambah", "kurang"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                aria-pressed={direction === d}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                  direction === d
                    ? "border-brand-200 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink",
                )}
              >
                {d === "tambah" ? "Tambah (+)" : "Kurangi (−)"}
              </button>
            ))}
          </div>

          <div className="mt-5" aria-live="polite">
            {amountInvalid ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                Masukkan jumlah berupa bilangan bulat non-negatif.
              </div>
            ) : shifted ? (
              <div className="rounded-card bg-brand-50 px-4 py-5 text-brand-900 sm:px-5">
                <p className="text-xs font-semibold opacity-80">
                  {direction === "tambah" ? "Hasil setelah ditambah" : "Hasil setelah dikurangi"}
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {longDateFormatter.format(shifted.result)}
                </p>
                <p className="mt-1.5 text-sm opacity-80">
                  Dari {formatPartsId(shifted.base)}: {numberFormatter.format(shifted.amount)}{" "}
                  {unit}
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-surface-muted px-3.5 py-3 text-center text-sm text-ink-secondary">
                Pilih tanggal dasar dan jumlahnya untuk melihat hasilnya.
              </p>
            )}
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
