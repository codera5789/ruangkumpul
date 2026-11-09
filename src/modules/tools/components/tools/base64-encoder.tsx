"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

type Mode = "encode" | "decode";

const MODES: { value: Mode; label: string }[] = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

/** Encode teks Unicode ke Base64: TextEncoder → binary string per-chunk → btoa. */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

/** Decode Base64 ke teks UTF-8: atob → byte array → TextDecoder. */
function decodeBase64(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  if (normalized.length === 0) return "";
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error("invalid-base64");
  }
  // Base64 tanpa padding (mis. "SGVsbG8") valid; tambahkan "=" sebelum atob.
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized + "=".repeat(4 - (normalized.length % 4));
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export default function Base64Encoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: "" };
    try {
      const result = mode === "encode" ? encodeBase64(input) : decodeBase64(input);
      return { output: result, error: "" };
    } catch {
      return {
        output: "",
        error:
          "Input bukan Base64 yang valid. Pastikan hanya berisi huruf A–Z, angka, tanda +, /, dan padding = yang benar.",
      };
    }
  }, [input, mode]);

  return (
    <ToolPanel>
      {/* Toggle mode */}
      <div
        role="tablist"
        aria-label="Mode konversi"
        className="mb-5 inline-flex rounded-xl border border-slate-200 bg-surface-muted p-1"
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

      <ToolLabel
        htmlFor="base64-input"
        hint={mode === "encode" ? "Teks biasa" : "Base64"}
      >
        {mode === "encode" ? "Teks yang ingin di-encode" : "Base64 yang ingin di-decode"}
      </ToolLabel>
      <Textarea
        id="base64-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        className="font-mono text-[13px]"
        placeholder={
          mode === "encode"
            ? "Ketik atau tempel teks di sini, termasuk emoji dan karakter Unicode..."
            : "Tempel string Base64 di sini..."
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
        <ToolLabel hint={mode === "encode" ? "Base64" : "Teks biasa"}>
          Hasil
        </ToolLabel>
        <ToolOutput
          value={output}
          rows={6}
          placeholder="Hasil konversi akan muncul otomatis di sini..."
        />
      </div>
    </ToolPanel>
  );
}
