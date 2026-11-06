"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

type LoremMode = "paragraf" | "kalimat" | "kata";

const LOREM_MODES: { value: LoremMode; label: string }[] = [
  { value: "paragraf", label: "Paragraf" },
  { value: "kalimat", label: "Kalimat" },
  { value: "kata", label: "Kata" },
];

/** Kosakata lorem ipsum klasik (Cicero, de Finibus Bonorum et Malorum). */
const LOREM_VOCABULARY = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
];

const OPENER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100;

function randomWord(): string {
  return LOREM_VOCABULARY[Math.floor(Math.random() * LOREM_VOCABULARY.length)];
}

function parseAmount(raw: string): number {
  const parsed = Math.floor(Number(raw));
  if (!Number.isFinite(parsed) || parsed < MIN_AMOUNT) return MIN_AMOUNT;
  return Math.min(parsed, MAX_AMOUNT);
}

/** Kalimat acak 6–14 kata dengan koma sesekali, diawali huruf besar dan diakhiri titik. */
function buildSentence(): string {
  const wordCount = 6 + Math.floor(Math.random() * 9);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i += 1) {
    const isLast = i === wordCount - 1;
    const addComma = !isLast && i >= 2 && Math.random() < 0.15;
    words.push(randomWord() + (addComma ? "," : ""));
  }
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function buildParagraph(sentenceCount: number, isFirstParagraph: boolean): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i += 1) {
    // Paragraf pertama harus diawali kalimat pembuka klasik.
    sentences.push(isFirstParagraph && i === 0 ? OPENER : buildSentence());
  }
  return sentences.join(" ");
}

export default function LoremIpsum() {
  const [mode, setMode] = useState<LoremMode>("paragraf");
  const [amountRaw, setAmountRaw] = useState("3");
  const [output, setOutput] = useState("");

  function handleGenerate() {
    const amount = parseAmount(amountRaw);
    let generated = "";

    if (mode === "kata") {
      const words: string[] = [];
      for (let i = 0; i < amount; i += 1) words.push(randomWord());
      generated = words.join(" ");
    } else if (mode === "kalimat") {
      const sentences: string[] = [];
      for (let i = 0; i < amount; i += 1) sentences.push(buildSentence());
      generated = sentences.join(" ");
    } else {
      const paragraphs: string[] = [];
      for (let i = 0; i < amount; i += 1) {
        const sentenceCount = 4 + Math.floor(Math.random() * 4); // 4–7 kalimat
        paragraphs.push(buildParagraph(sentenceCount, i === 0));
      }
      generated = paragraphs.join("\n\n");
    }

    setOutput(generated);
  }

  return (
    <ToolPanel>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <ToolLabel htmlFor="lorem-mode">Mode</ToolLabel>
          <select
            id="lorem-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as LoremMode)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-hidden"
          >
            {LOREM_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <ToolLabel htmlFor="lorem-amount" hint={`1–${MAX_AMOUNT}`}>
            Jumlah
          </ToolLabel>
          <Input
            id="lorem-amount"
            type="number"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={handleGenerate}>Generate</Button>
      </div>

      <div className="mt-5">
        <ToolLabel hint="Siap disalin">Hasil</ToolLabel>
        <ToolOutput
          value={output}
          rows={10}
          placeholder="Klik Generate untuk membuat teks placeholder..."
        />
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Paragraf pertama selalu diawali kalimat klasik &ldquo;{OPENER}&rdquo;
      </p>
    </ToolPanel>
  );
}
