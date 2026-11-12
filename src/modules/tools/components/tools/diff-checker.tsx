"use client";

import { useId, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

const SAMPLE_OLD = `function hitungDiskon(harga, persen) {
  const diskon = harga * persen;
  return harga - diskon;
}

console.log(hitungDiskon(100000, 10));
`;

const SAMPLE_NEW = `function hitungDiskon(harga, persen) {
  // Validasi input harga dan persen
  if (harga <= 0 || persen <= 0) return harga;
  const diskon = (harga * persen) / 100;
  return harga - diskon;
}

console.log(hitungDiskon(100000, 10));
`;

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

/**
 * Algoritma diff sederhana baris demi baris (LCS-based / greedy diff).
 * Berjalan murni di browser klien.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const diff: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        diff.push({
          type: "unchanged",
          oldLineNumber: oldIdx + 1,
          newLineNumber: newIdx + 1,
          text: oldLines[oldIdx],
        });
        oldIdx++;
        newIdx++;
        continue;
      }

      // Cek apakah baris baru ada di baris berikutnya pada teks lama
      const nextMatchInOld = oldLines.indexOf(newLines[newIdx], oldIdx);
      const nextMatchInNew = newLines.indexOf(oldLines[oldIdx], newIdx);

      if (nextMatchInOld !== -1 && (nextMatchInNew === -1 || nextMatchInOld - oldIdx <= nextMatchInNew - newIdx)) {
        diff.push({
          type: "removed",
          oldLineNumber: oldIdx + 1,
          text: oldLines[oldIdx],
        });
        oldIdx++;
      } else {
        diff.push({
          type: "added",
          newLineNumber: newIdx + 1,
          text: newLines[newIdx],
        });
        newIdx++;
      }
    } else if (oldIdx < oldLines.length) {
      diff.push({
        type: "removed",
        oldLineNumber: oldIdx + 1,
        text: oldLines[oldIdx],
      });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      diff.push({
        type: "added",
        newLineNumber: newIdx + 1,
        text: newLines[newIdx],
      });
      newIdx++;
    }
  }

  return diff;
}

export default function DiffChecker() {
  const [oldText, setOldText] = useState(SAMPLE_OLD);
  const [newText, setNewText] = useState(SAMPLE_NEW);
  const oldTextareaId = useId();
  const newTextareaId = useId();

  const diffResult = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (const line of diffResult) {
      if (line.type === "added") added++;
      else if (line.type === "removed") removed++;
      else unchanged++;
    }
    return { added, removed, unchanged };
  }, [diffResult]);

  return (
    <div className="space-y-6">
      {/* Tombol aksi cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">
          Masukkan teks asli di kolom kiri dan teks baru di kolom kanan
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setOldText(SAMPLE_OLD);
              setNewText(SAMPLE_NEW);
            }}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Muat Contoh
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOldText("");
              setNewText("");
            }}
            className="h-8 gap-1.5 text-xs text-ink-muted hover:text-red-600"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Bersihkan
          </Button>
        </div>
      </div>

      {/* Editor Teks Input */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ToolPanel>
          <ToolLabel htmlFor={oldTextareaId}>Teks Asli (Versi Lama)</ToolLabel>
          <textarea
            id={oldTextareaId}
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="Tempel teks asli di sini..."
            rows={10}
            className="w-full resize-y rounded-xl border border-slate-200 bg-surface p-3.5 font-mono text-sm leading-relaxed text-ink focus:border-brand-500 focus:outline-hidden"
          />
        </ToolPanel>

        <ToolPanel>
          <ToolLabel htmlFor={newTextareaId}>Teks Baru (Versi Baru)</ToolLabel>
          <textarea
            id={newTextareaId}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Tempel teks baru di sini..."
            rows={10}
            className="w-full resize-y rounded-xl border border-slate-200 bg-surface p-3.5 font-mono text-sm leading-relaxed text-ink focus:border-brand-500 focus:outline-hidden"
          />
        </ToolPanel>
      </div>

      {/* Panel Hasil Perbandingan */}
      <ToolPanel title="Hasil Perbandingan Baris">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-emerald-800">
            +{stats.added} penambahan
          </span>
          <span className="rounded-md bg-red-100 px-2.5 py-1 text-red-800">
            -{stats.removed} pengurangan
          </span>
          <span className="text-ink-muted">{stats.unchanged} baris sama</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 font-mono text-xs leading-relaxed text-slate-100">
          {diffResult.length > 0 ? (
            <table className="w-full border-collapse">
              <tbody>
                {diffResult.map((line, idx) => {
                  let bgClass = "hover:bg-slate-800/50";
                  let textClass = "text-slate-300";
                  let sign = " ";

                  if (line.type === "added") {
                    bgClass = "bg-emerald-950/60 text-emerald-200 hover:bg-emerald-950/80";
                    textClass = "text-emerald-300";
                    sign = "+";
                  } else if (line.type === "removed") {
                    bgClass = "bg-red-950/60 text-red-200 hover:bg-red-950/80";
                    textClass = "text-red-300";
                    sign = "-";
                  }

                  return (
                    <tr key={idx} className={`${bgClass} transition-colors`}>
                      <td className="w-10 select-none border-r border-slate-800 px-2 py-0.5 text-right text-slate-500">
                        {line.oldLineNumber || ""}
                      </td>
                      <td className="w-10 select-none border-r border-slate-800 px-2 py-0.5 text-right text-slate-500">
                        {line.newLineNumber || ""}
                      </td>
                      <td className="w-6 select-none px-2 py-0.5 text-center font-bold text-slate-400">
                        {sign}
                      </td>
                      <td className={`px-2 py-0.5 whitespace-pre-wrap break-all ${textClass}`}>
                        {line.text || " "}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-slate-400">Belum ada teks untuk dibandingkan.</p>
          )}
        </div>
      </ToolPanel>
    </div>
  );
}
