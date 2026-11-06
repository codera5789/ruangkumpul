"use client";

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

/** Kecepatan baca rata-rata yang dipakai untuk estimasi waktu baca. */
const READING_SPEED_WPM = 200;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-4 py-3.5">
      <p className="text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-ink-secondary">{label}</p>
    </div>
  );
}

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0).length;
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;
    const readMinutes =
      words === 0 ? 0 : Math.max(1, Math.ceil(words / READING_SPEED_WPM));

    return {
      words,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      sentences,
      paragraphs,
      readMinutes,
    };
  }, [text]);

  return (
    <ToolPanel>
      <ToolLabel htmlFor="word-counter-input" hint="Dihitung otomatis saat mengetik">
        Teks Anda
      </ToolLabel>
      <Textarea
        id="word-counter-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Tempel atau ketik teks Anda di sini..."
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite">
        <StatCard label="Kata" value={formatNumber(stats.words)} />
        <StatCard label="Karakter" value={formatNumber(stats.characters)} />
        <StatCard label="Tanpa spasi" value={formatNumber(stats.charactersNoSpaces)} />
        <StatCard label="Kalimat" value={formatNumber(stats.sentences)} />
        <StatCard label="Paragraf" value={formatNumber(stats.paragraphs)} />
        <StatCard label="Waktu baca" value={`±${stats.readMinutes} menit`} />
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Estimasi waktu baca mengasumsikan kecepatan {READING_SPEED_WPM} kata per menit.
      </p>
    </ToolPanel>
  );
}
