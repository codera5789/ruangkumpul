"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

const DAY_MS = 86_400_000;

interface CalendarParts {
  year: number;
  month: number; // 0-based
  day: number;
}

/** Parse "YYYY-MM-DD" dari input date tanpa pergeseran zona waktu. */
function parseDateParts(value: string): CalendarParts | null {
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

function toUtcMillis(parts: CalendarParts): number {
  return Date.UTC(parts.year, parts.month, parts.day);
}

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  daysToNextBirthday: number;
  isBirthdayToday: boolean;
}

/** Selisih kalender presisi dengan pinjaman hari dari panjang bulan sebelumnya. */
function computeAge(birth: CalendarParts, today: CalendarParts): AgeResult {
  let years = today.year - birth.year;
  let months = today.month - birth.month;
  let days = today.day - birth.day;

  if (days < 0) {
    months -= 1;
    // Pinjam hari dari bulan sebelum bulan referensi (hari ini).
    const daysInPrevMonth = new Date(today.year, today.month, 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor((toUtcMillis(today) - toUtcMillis(birth)) / DAY_MS);
  const totalWeeks = Math.floor(totalDays / 7);

  // Ulang tahun berikutnya (29 Feb digulirkan JS ke 1 Mar pada tahun non-kabisat).
  let nextBirthday = new Date(today.year, birth.month, birth.day);
  const todayMidnight = new Date(today.year, today.month, today.day);
  if (nextBirthday.getTime() < todayMidnight.getTime()) {
    nextBirthday = new Date(today.year + 1, birth.month, birth.day);
  }
  const daysToNextBirthday = Math.round(
    (nextBirthday.getTime() - todayMidnight.getTime()) / DAY_MS,
  );

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    daysToNextBirthday,
    isBirthdayToday: daysToNextBirthday === 0,
  };
}

function todayParts(): CalendarParts {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200/80 bg-surface p-4 shadow-card",
        className,
      )}
    >
      <p className="text-xs font-semibold text-ink-secondary">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export default function AgeCalculator() {
  const [birthValue, setBirthValue] = useState("");

  const { result, error } = useMemo(() => {
    if (birthValue === "") {
      return { result: null, error: "" };
    }
    const birth = parseDateParts(birthValue);
    if (!birth) {
      return { result: null, error: "Tanggal lahir tidak valid. Periksa kembali pilihan Anda." };
    }
    const today = todayParts();
    if (toUtcMillis(birth) > toUtcMillis(today)) {
      return { result: null, error: "Tanggal lahir tidak boleh di masa depan." };
    }
    return { result: computeAge(birth, today), error: "" };
  }, [birthValue]);

  return (
    <ToolPanel title="Tanggal lahir">
      <ToolLabel htmlFor="birth-date" hint="Maksimal hari ini">
        Pilih tanggal lahir
      </ToolLabel>
      <input
        id="birth-date"
        type="date"
        value={birthValue}
        onChange={(e) => setBirthValue(e.target.value)}
        // Batas tanggal di-set lewat ref callback (sisi klien) agar bebas ketidakcocokan hydration.
        ref={(el) => {
          if (el) {
            const t = todayParts();
            el.max = `${t.year}-${String(t.month + 1).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
          }
        }}
        className="h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
      />

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!result && !error ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-surface-muted px-3.5 py-3 text-sm text-ink-secondary">
          Pilih tanggal lahir Anda untuk melihat rincian umur.
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
          <StatCard
            label="Umur Anda"
            value={`${result.years} tahun`}
            hint={`${result.months} bulan ${result.days} hari`}
            className="sm:col-span-3 bg-brand-50 border-brand-100"
          />
          <StatCard
            label="Total hari hidup"
            value={new Intl.NumberFormat("id-ID").format(result.totalDays)}
            hint="hari"
          />
          <StatCard
            label="Total minggu"
            value={new Intl.NumberFormat("id-ID").format(result.totalWeeks)}
            hint="minggu penuh"
          />
          <StatCard
            label="Ulang tahun berikutnya"
            value={
              result.isBirthdayToday
                ? "Hari ini!"
                : `${new Intl.NumberFormat("id-ID").format(result.daysToNextBirthday)} hari`
            }
            hint={result.isBirthdayToday ? "Selamat ulang tahun!" : "menuju hari besar Anda"}
          />
        </div>
      ) : null}
    </ToolPanel>
  );
}
