"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

type CaseFormat =
  | "uppercase"
  | "lowercase"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "alternating";

const FORMATS: { value: CaseFormat; label: string }[] = [
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "title", label: "Title Case" },
  { value: "sentence", label: "Sentence case" },
  { value: "camel", label: "camelCase" },
  { value: "pascal", label: "PascalCase" },
  { value: "snake", label: "snake_case" },
  { value: "kebab", label: "kebab-case" },
  { value: "alternating", label: "aLtErNaTiNg" },
];

function capitalizeWord(word: string): string {
  if (word === "") return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

function toTitleCase(text: string): string {
  return text.replace(/\S+/g, (word) => capitalizeWord(word));
}

/** Huruf pertama tiap kalimat (awal teks, setelah . ! ?, atau baris baru) dikapitalisasi. */
function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^\s*[a-z])|([.!?]\s+[a-z])|(\n\s*[a-z])/g, (match) => match.toUpperCase());
}

/** camelCase / PascalCase — batas kata berdasarkan spasi. */
function toJoinedCase(text: string, capitalizeFirst: boolean): string {
  const words = splitWords(text);
  if (words.length === 0) return "";
  const rest = words.slice(1).map(capitalizeWord).join("");
  const head = capitalizeFirst ? capitalizeWord(words[0]) : words[0].toLowerCase();
  return head + rest;
}

/** snake_case / kebab-case — karakter non-alfanumerik menjadi pemisah. */
function toSeparatorCase(text: string, separator: string): string {
  return text
    .replace(/[^\p{L}\p{N}]+/gu, separator)
    .replace(/^[-_]+|[-_]+$/g, "")
    .toLowerCase();
}

function toAlternatingCase(text: string): string {
  let letterIndex = 0;
  return [...text]
    .map((char) => {
      const lower = char.toLowerCase();
      if (lower === char.toUpperCase()) return char; // bukan huruf
      const result = letterIndex % 2 === 0 ? lower : char.toUpperCase();
      letterIndex += 1;
      return result;
    })
    .join("");
}

function convert(text: string, format: CaseFormat): string {
  switch (format) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "title":
      return toTitleCase(text);
    case "sentence":
      return toSentenceCase(text);
    case "camel":
      return toJoinedCase(text, false);
    case "pascal":
      return toJoinedCase(text, true);
    case "snake":
      return toSeparatorCase(text, "_");
    case "kebab":
      return toSeparatorCase(text, "-");
    case "alternating":
      return toAlternatingCase(text);
  }
}

export default function CaseConverter() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<CaseFormat>("uppercase");

  const output = useMemo(() => (input === "" ? "" : convert(input, format)), [input, format]);

  return (
    <ToolPanel>
      <ToolLabel htmlFor="case-converter-input">Teks yang ingin diubah</ToolLabel>
      <Textarea
        id="case-converter-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder="Ketik atau tempel teks Anda di sini..."
      />

      <div className="mt-5" role="group" aria-label="Format huruf">
        <p className="mb-2 text-sm font-semibold text-ink">Pilih format huruf</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORMATS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={format === item.value}
              onClick={() => setFormat(item.value)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                format === item.value
                  ? "border-brand-300 bg-brand-50 text-brand-800"
                  : "border-slate-200/80 bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <ToolLabel hint="Berubah otomatis">Hasil</ToolLabel>
        <ToolOutput
          value={output}
          rows={6}
          placeholder="Hasil konversi akan muncul otomatis di sini..."
        />
      </div>
    </ToolPanel>
  );
}
