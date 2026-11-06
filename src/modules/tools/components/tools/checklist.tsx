"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rk-checklist-v1";
const MAX_TEXT_LENGTH = 200;

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

/** Validasi bentuk data dari localStorage agar data rusak tidak merusak UI. */
function isChecklistItem(value: unknown): value is ChecklistItem {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.text === "string" &&
    typeof record.done === "boolean"
  );
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Muat data tersimpan dari localStorage sekali saat mount (aman untuk SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Hidrasi dari localStorage hanya bisa terjadi di effect (SSR-safe).
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed.filter(isChecklistItem));
        }
      }
    } catch {
      // Data rusak atau JSON tidak valid — mulai dengan daftar kosong.
    }
    setHydrated(true);
  }, []);

  // Simpan setiap perubahan, tetapi hanya setelah data awal selesai dimuat
  // agar daftar kosong sementara tidak menimpa data yang tersimpan.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Penyimpanan lokal bisa jadi penuh atau diblokir browser.
    }
  }, [items, hydrated]);

  const doneCount = items.filter((item) => item.done).length;

  function handleAdd() {
    const text = draft.trim();
    if (!text) {
      setError("Tulis tugas terlebih dahulu.");
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Maksimal ${MAX_TEXT_LENGTH} karakter.`);
      return;
    }
    if (items.some((item) => item.text.toLowerCase() === text.toLowerCase())) {
      setError("Tugas dengan teks yang sama sudah ada.");
      return;
    }
    setItems((prev) => [...prev, { id: createId(), text, done: false }]);
    setDraft("");
    setError(null);
  }

  function handleToggle(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearDone() {
    setItems((prev) => prev.filter((item) => !item.done));
  }

  return (
    <ToolPanel title="Daftar tugas">
      <form
        className="flex items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleAdd();
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            value={draft}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Tulis tugas baru, lalu tekan Enter..."
            aria-label="Tugas baru"
            error={error}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        <Button type="submit" className="h-11 shrink-0">
          <Plus className="size-4" aria-hidden="true" />
          Tambah
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-surface-muted px-4 py-10 text-center text-sm text-ink-muted">
          Belum ada tugas. Tambahkan tugas pertama Anda di atas.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-surface-muted px-3.5 py-2.5"
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleToggle(item.id)}
                aria-label={`Tandai selesai: ${item.text}`}
                className="size-4 shrink-0 accent-brand-800"
              />
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm break-words text-ink",
                  item.done && "text-ink-muted line-through",
                )}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Hapus tugas: ${item.text}`}
                className="shrink-0 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-ink-secondary">
            <span className="font-bold text-ink">{doneCount}</span> dari {items.length} selesai
          </p>
          {doneCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleClearDone}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              Hapus yang selesai
            </Button>
          ) : null}
        </div>
      ) : null}
    </ToolPanel>
  );
}
