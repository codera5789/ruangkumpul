"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

type Mode = "encode" | "decode";
type Scope = "komponen" | "url-penuh";

const MODES: { value: Mode; label: string }[] = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

const SCOPES: { value: Scope; label: string; description: string }[] = [
  {
    value: "komponen",
    label: "Komponen",
    description:
      "Meng-encode semua karakter khusus termasuk ?, &, =, /. Cocok untuk nilai parameter query.",
  },
  {
    value: "url-penuh",
    label: "URL penuh",
    description:
      "Mempertahankan karakter struktur URL (:, /, ?, &, #). Cocok untuk meng-encode URL utuh.",
  },
];

function encodeUrl(text: string, scope: Scope): string {
  return scope === "komponen" ? encodeURIComponent(text) : encodeURI(text);
}

function decodeUrl(text: string, scope: Scope): string {
  return scope === "komponen" ? decodeURIComponent(text) : decodeURI(text);
}

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [scope, setScope] = useState<Scope>("komponen");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: "" };
    try {
      const result =
        mode === "encode" ? encodeUrl(input, scope) : decodeUrl(input, scope);
      return { output: result, error: "" };
    } catch {
      return {
        output: "",
        error:
          "Gagal men-decode: format percent-encoding tidak valid (mis. % diikuti karakter non-heksadesimal seperti %E0%80).",
      };
    }
  }, [input, mode, scope]);

  const activeScope = SCOPES.find((s) => s.value === scope);

  return (
    <ToolPanel>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Toggle mode */}
        <div
          role="tablist"
          aria-label="Mode konversi"
          className="inline-flex rounded-xl border border-slate-200 bg-surface-muted p-1"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                mode === m.value
                  ? "bg-surface text-brand-800 shadow-xs"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Sub-mode: komponen vs URL penuh */}
        <select
          aria-label="Ruang encode"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className="h-9 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
        >
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {activeScope ? (
        <p className="mb-4 rounded-xl bg-surface-muted px-3.5 py-2.5 text-xs leading-relaxed text-ink-secondary">
          {activeScope.description}
        </p>
      ) : null}

      <ToolLabel htmlFor="url-input" hint={mode === "encode" ? "Teks / URL" : "Percent-encoded"}>
        {mode === "encode" ? "Teks yang ingin di-encode" : "Teks yang ingin di-decode"}
      </ToolLabel>
      <Textarea
        id="url-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        className="font-mono text-[13px]"
        placeholder={
          mode === "encode"
            ? "Contoh: https://contoh.id/cari?q=kopi susu&urut=harga"
            : "Contoh: kopi%20susu%20gula%20aren"
        }
        spellCheck={false}
      />

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        <ToolLabel hint={mode === "encode" ? "Encoded" : "Decoded"}>Hasil</ToolLabel>
        <ToolOutput
          value={output}
          rows={5}
          placeholder="Hasil konversi akan muncul otomatis di sini..."
        />
      </div>
    </ToolPanel>
  );
}
