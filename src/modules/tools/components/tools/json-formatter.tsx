"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

type Indent = "2" | "4" | "minify";

const INDENT_OPTIONS: { value: Indent; label: string }[] = [
  { value: "2", label: "2 spasi" },
  { value: "4", label: "4 spasi" },
  { value: "minify", label: "Minify" },
];

const textEncoder = new TextEncoder();

function countBytes(text: string): number {
  return textEncoder.encode(text).length;
}

function formatBytes(bytes: number): string {
  const formatted = new Intl.NumberFormat("id-ID").format(bytes);
  if (bytes < 1024) return `${formatted} byte`;
  const kb = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(bytes / 1024);
  return `${kb} KB`;
}

interface FormatResult {
  output: string;
  error: string;
  originalBytes: number;
  resultBytes: number;
}

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<Indent>("2");
  const [result, setResult] = useState<FormatResult | null>(null);

  function handleFormat() {
    if (input.trim() === "") {
      setResult({ output: "", error: "Masukkan JSON terlebih dahulu.", originalBytes: 0, resultBytes: 0 });
      return;
    }

    const originalBytes = countBytes(input);
    try {
      const parsed: unknown = JSON.parse(input);
      const output =
        indent === "minify"
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, indent === "2" ? 2 : 4);
      setResult({ output, error: "", originalBytes, resultBytes: countBytes(output) });
    } catch (err) {
      setResult({
        output: "",
        error: err instanceof Error ? err.message : "JSON tidak valid.",
        originalBytes,
        resultBytes: 0,
      });
    }
  }

  return (
    <ToolPanel>
      <ToolLabel htmlFor="json-formatter-input">Input JSON</ToolLabel>
      <Textarea
        id="json-formatter-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        className="font-mono text-[13px]"
        placeholder={'{ "nama": "RuangKumpul", "tahun": 2025 }'}
        spellCheck={false}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          aria-label="Indentasi"
          value={indent}
          onChange={(e) => setIndent(e.target.value as Indent)}
          className="h-10 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
        >
          {INDENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button onClick={handleFormat}>Format</Button>
      </div>

      {result?.error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          <p className="font-bold">JSON tidak valid</p>
          <p className="mt-1 break-words font-mono text-xs leading-relaxed">{result.error}</p>
        </div>
      ) : null}

      {result && !result.error ? (
        <div className="mt-5">
          <ToolLabel
            hint={`Asli ${formatBytes(result.originalBytes)} → Hasil ${formatBytes(result.resultBytes)}`}
          >
            Hasil
          </ToolLabel>
          <ToolOutput value={result.output} rows={10} />
        </div>
      ) : null}
    </ToolPanel>
  );
}
