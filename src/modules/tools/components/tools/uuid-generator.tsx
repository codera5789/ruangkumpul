"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLabel, ToolOutput, ToolPanel } from "@/modules/tools/components/tool-shell";

const MIN_COUNT = 1;
const MAX_COUNT = 500;

const COUNT_TOGGLE_CLASS =
  "flex cursor-pointer items-center gap-2.5 self-end rounded-xl border border-slate-200/80 bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-surface-muted";

function parseCount(raw: string): number {
  const parsed = Math.floor(Number(raw));
  if (!Number.isFinite(parsed) || parsed < MIN_COUNT) return MIN_COUNT;
  return Math.min(parsed, MAX_COUNT);
}

/** UUID v4 manual dari crypto.getRandomValues (fallback bila randomUUID tidak tersedia). */
function buildUuidV4FromRandomBytes(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versi 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // varian RFC 4122
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return buildUuidV4FromRandomBytes();
}

export default function UuidGenerator() {
  const [countRaw, setCountRaw] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [removeDashes, setRemoveDashes] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);

  const output = useMemo(
    () =>
      uuids
        .map((uuid) => {
          const dashed = removeDashes ? uuid.replace(/-/g, "") : uuid;
          return uppercase ? dashed.toUpperCase() : dashed;
        })
        .join("\n"),
    [uuids, uppercase, removeDashes],
  );

  function handleGenerate() {
    const count = parseCount(countRaw);
    const generated: string[] = [];
    for (let i = 0; i < count; i += 1) {
      generated.push(generateUuidV4());
    }
    setUuids(generated);
  }

  return (
    <ToolPanel>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <ToolLabel htmlFor="uuid-count" hint={`1–${MAX_COUNT}`}>
            Jumlah
          </ToolLabel>
          <Input
            id="uuid-count"
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={countRaw}
            onChange={(e) => setCountRaw(e.target.value)}
            inputMode="numeric"
          />
        </div>

        <label className={COUNT_TOGGLE_CLASS}>
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          Huruf besar
        </label>

        <label className={COUNT_TOGGLE_CLASS}>
          <input
            type="checkbox"
            checked={removeDashes}
            onChange={(e) => setRemoveDashes(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          Hapus tanda hubung
        </label>
      </div>

      <div className="mt-4">
        <Button onClick={handleGenerate}>Generate</Button>
      </div>

      <div className="mt-5">
        <ToolLabel hint={uuids.length > 0 ? `${uuids.length} UUID` : "Satu UUID per baris"}>
          Hasil
        </ToolLabel>
        <ToolOutput
          value={output}
          rows={10}
          placeholder="Klik Generate untuk membuat UUID..."
        />
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        UUID v4 memakai 122 bit random — praktis mustahil duplikat. Dibuat oleh crypto API di
        browser Anda, tidak dikirim ke server.
      </p>
    </ToolPanel>
  );
}
