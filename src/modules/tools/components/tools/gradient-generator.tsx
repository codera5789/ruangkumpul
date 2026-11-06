"use client";

import { useMemo, useState } from "react";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

type GradientType = "linear" | "radial";

interface GradientPreset {
  name: string;
  from: string;
  to: string;
}

const PRESETS: GradientPreset[] = [
  { name: "Senja", from: "#f97316", to: "#db2777" },
  { name: "Laut", from: "#22d3ee", to: "#2563eb" },
  { name: "Ungu", from: "#a855f7", to: "#4f46e5" },
  { name: "Hutan", from: "#34d399", to: "#065f46" },
  { name: "Malam", from: "#1e1b4b", to: "#4338ca" },
];

export default function GradientGenerator() {
  const [color1, setColor1] = useState("#3730a3");
  const [color2, setColor2] = useState("#38bdf8");
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);

  const cssValue = useMemo(() => {
    return type === "linear"
      ? `linear-gradient(${angle}deg, ${color1}, ${color2})`
      : `radial-gradient(circle, ${color1}, ${color2})`;
  }, [type, angle, color1, color2]);

  function applyPreset(preset: GradientPreset) {
    setColor1(preset.from);
    setColor2(preset.to);
  }

  return (
    <div className="grid gap-6">
      <ToolPanel title="Atur gradient">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ToolLabel htmlFor="warna-1" hint={color1.toUpperCase()}>
              Warna 1
            </ToolLabel>
            <input
              id="warna-1"
              type="color"
              value={color1}
              onChange={(event) => setColor1(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-surface p-1.5 transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
          </div>
          <div>
            <ToolLabel htmlFor="warna-2" hint={color2.toUpperCase()}>
              Warna 2
            </ToolLabel>
            <input
              id="warna-2"
              type="color"
              value={color2}
              onChange={(event) => setColor2(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-surface p-1.5 transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            />
          </div>
          <div>
            <ToolLabel htmlFor="tipe-gradient">Tipe</ToolLabel>
            <select
              id="tipe-gradient"
              value={type}
              onChange={(event) => setType(event.target.value === "radial" ? "radial" : "linear")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </div>
          {type === "linear" ? (
            <div>
              <ToolLabel htmlFor="sudut-gradient" hint={`${angle}°`}>
                Sudut
              </ToolLabel>
              <input
                id="sudut-gradient"
                type="range"
                min={0}
                max={360}
                step={1}
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="h-11 w-full cursor-pointer accent-brand-800"
              />
            </div>
          ) : null}
        </div>
      </ToolPanel>

      <ToolPanel title="Preview">
        <div
          className="h-40 rounded-xl border border-slate-200/80"
          style={{ backgroundImage: cssValue }}
        />

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-ink">Preset populer</p>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "h-10 w-16 rounded-lg border border-slate-200/80 shadow-xs transition-transform group-hover:scale-105",
                  )}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                  }}
                />
                <span className="text-xs font-medium text-ink-secondary group-hover:text-ink">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ToolPanel>

      <ToolPanel title="Kode CSS">
        <ToolOutput value={cssValue} rows={2} placeholder="Kode CSS akan muncul di sini..." />
      </ToolPanel>
    </div>
  );
}
