"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

interface UnitDef {
  id: string;
  label: string;
  /** Faktor konversi ke satuan dasar kategori (abaikan untuk suhu). */
  factor: number;
}

interface CategoryDef {
  id: string;
  label: string;
  units: UnitDef[];
  defaultFrom: string;
  defaultTo: string;
}

const LENGTH_UNITS: UnitDef[] = [
  { id: "mm", label: "Milimeter (mm)", factor: 0.001 },
  { id: "cm", label: "Sentimeter (cm)", factor: 0.01 },
  { id: "m", label: "Meter (m)", factor: 1 },
  { id: "km", label: "Kilometer (km)", factor: 1000 },
  { id: "inci", label: "Inci", factor: 0.0254 },
  { id: "kaki", label: "Kaki", factor: 0.3048 },
  { id: "mil", label: "Mil", factor: 1609.344 },
  { id: "mil-laut", label: "Mil laut", factor: 1852 },
];

const WEIGHT_UNITS: UnitDef[] = [
  { id: "mg", label: "Miligram (mg)", factor: 0.001 },
  { id: "g", label: "Gram (g)", factor: 1 },
  { id: "kg", label: "Kilogram (kg)", factor: 1000 },
  { id: "ton", label: "Ton", factor: 1_000_000 },
  { id: "ons", label: "Ons (100 g)", factor: 100 },
  { id: "pound", label: "Pound (lb)", factor: 453.59237 },
  { id: "ounce", label: "Ounce (oz)", factor: 28.349523125 },
];

const TEMP_UNITS: UnitDef[] = [
  { id: "celsius", label: "Celsius (°C)", factor: 1 },
  { id: "fahrenheit", label: "Fahrenheit (°F)", factor: 1 },
  { id: "kelvin", label: "Kelvin (K)", factor: 1 },
];

const DATA_UNITS: UnitDef[] = [
  { id: "byte", label: "Byte", factor: 1 },
  { id: "kb", label: "Kilobyte (KB)", factor: 1024 },
  { id: "mb", label: "Megabyte (MB)", factor: 1024 ** 2 },
  { id: "gb", label: "Gigabyte (GB)", factor: 1024 ** 3 },
  { id: "tb", label: "Terabyte (TB)", factor: 1024 ** 4 },
];

const CATEGORIES: CategoryDef[] = [
  { id: "panjang", label: "Panjang", units: LENGTH_UNITS, defaultFrom: "m", defaultTo: "km" },
  { id: "berat", label: "Berat", units: WEIGHT_UNITS, defaultFrom: "kg", defaultTo: "g" },
  { id: "suhu", label: "Suhu", units: TEMP_UNITS, defaultFrom: "celsius", defaultTo: "fahrenheit" },
  { id: "data", label: "Data", units: DATA_UNITS, defaultFrom: "mb", defaultTo: "gb" },
];

const TEMPERATURE_NOTE =
  "Rumus suhu: °F = (°C × 9/5) + 32 · °C = (°F − 32) × 5/9 · K = °C + 273,15";

/** Suhu dikonversi via Celsius; kategori lain via faktor ke satuan dasar. */
function convert(value: number, from: UnitDef, to: UnitDef, categoryId: string): number {
  if (categoryId !== "suhu") {
    return (value * from.factor) / to.factor;
  }
  let celsius: number;
  if (from.id === "fahrenheit") celsius = (value - 32) * (5 / 9);
  else if (from.id === "kelvin") celsius = value - 273.15;
  else celsius = value;

  if (to.id === "fahrenheit") return celsius * (9 / 5) + 32;
  if (to.id === "kelvin") return celsius + 273.15;
  return celsius;
}

const resultFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 6,
});

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden";

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState("panjang");
  const [rawValue, setRawValue] = useState("1");
  const [fromId, setFromId] = useState("m");
  const [toId, setToId] = useState("km");

  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];

  function handleCategoryChange(next: CategoryDef) {
    setCategoryId(next.id);
    setFromId(next.defaultFrom);
    setToId(next.defaultTo);
  }

  const { output, unitLabel, error } = useMemo(() => {
    const from = category.units.find((u) => u.id === fromId) ?? category.units[0];
    const to = category.units.find((u) => u.id === toId) ?? category.units[0];
    if (rawValue.trim() === "") {
      return { output: "", unitLabel: "", error: "" };
    }
    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      return { output: "", unitLabel: "", error: "Masukkan angka yang valid." };
    }
    const result = convert(value, from, to, category.id);
    return {
      output: resultFormatter.format(result),
      unitLabel: to.label,
      error: "",
    };
  }, [category, fromId, toId, rawValue]);

  return (
    <ToolPanel>
      {/* Tab kategori */}
      <div
        role="tablist"
        aria-label="Kategori satuan"
        className="mb-5 flex flex-wrap gap-2"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={categoryId === c.id}
            onClick={() => handleCategoryChange(c)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
              categoryId === c.id
                ? "border-brand-200 bg-brand-50 text-brand-800"
                : "border-slate-200 bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card">
        <ToolLabel htmlFor="unit-value" hint={category.label}>
          Nilai yang dikonversi
        </ToolLabel>
        <input
          id="unit-value"
          type="number"
          step="any"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          placeholder="Contoh: 100"
          className={cn(
            "h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition-colors",
            "placeholder:text-ink-muted",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 hover:border-slate-300 focus:border-brand-500",
            "focus:outline-hidden",
          )}
          aria-invalid={error ? true : undefined}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <ToolLabel htmlFor="unit-from">Dari satuan</ToolLabel>
            <select
              id="unit-from"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className={SELECT_CLASS}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <ToolLabel htmlFor="unit-to">Ke satuan</ToolLabel>
            <select
              id="unit-to"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className={SELECT_CLASS}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {/* Kartu hasil */}
        <div className="mt-5" aria-live="polite">
          {output ? (
            <div className="rounded-card bg-brand-50 px-4 py-5 text-brand-900 sm:px-5">
              <p className="text-xs font-semibold opacity-80">
                Hasil konversi
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {output}
              </p>
              <p className="mt-1.5 text-sm font-semibold opacity-90">{unitLabel}</p>
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-slate-200 bg-surface-muted px-4 py-5 text-center text-sm text-ink-secondary">
              Masukkan nilai untuk melihat hasil konversi.
            </div>
          )}
        </div>

        {category.id === "suhu" ? (
          <p className="mt-4 rounded-xl bg-surface-muted px-3.5 py-2.5 text-xs leading-relaxed text-ink-secondary">
            {TEMPERATURE_NOTE}
          </p>
        ) : null}
      </div>
    </ToolPanel>
  );
}
