"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import {
  ALLOWED_MEDIA_IMAGE_TYPES,
  MAX_MEDIA_IMAGE_BYTES,
} from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

interface MediaImageFieldProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  currentUrl?: string | null;
  removeName?: string;
  previewClassName?: string;
  alt?: string;
}

/**
 * Field unggah gambar opsional dengan pratinjau instan, validasi JPG/PNG/WebP
 * maksimal 2 MB, serta opsi menghapus gambar lama saat menyunting konten.
 */
export function MediaImageField({
  id,
  name,
  label,
  hint = "JPG, PNG, atau WebP · maks. 2 MB",
  currentUrl,
  removeName,
  previewClassName = "aspect-16/9 w-full rounded-xl",
  alt = "Pratinjau gambar",
}: MediaImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearNewSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (
      !ALLOWED_MEDIA_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_MEDIA_IMAGE_TYPES)[number],
      )
    ) {
      setError("Format harus JPG, PNG, atau WebP.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_MEDIA_IMAGE_BYTES) {
      setError("Ukuran gambar maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoved(false);
  }

  const displayUrl = previewUrl ?? (removed ? null : currentUrl ?? null);

  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="block text-xs font-semibold text-ink-secondary">
        {label}
      </label>

      {removeName ? (
        <input type="hidden" name={removeName} value={removed ? "1" : ""} />
      ) : null}

      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={alt}
          className={cn("border border-slate-200 object-cover", previewClassName)}
        />
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept={ALLOWED_MEDIA_IMAGE_TYPES.join(",")}
        onChange={handleChange}
        className="sr-only"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
          {displayUrl ? "Ganti gambar" : "Pilih gambar"}
        </button>

        {previewUrl ? (
          <button
            type="button"
            onClick={clearNewSelection}
            className="inline-flex min-h-9 items-center gap-1 rounded-control px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink"
          >
            <X className="size-3.5" aria-hidden="true" />
            Batal
          </button>
        ) : currentUrl && removeName ? (
          <button
            type="button"
            onClick={() => setRemoved((prev) => !prev)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1 rounded-control px-2.5 py-1.5 text-xs font-medium transition-colors",
              removed
                ? "bg-brand-50 text-brand-800"
                : "text-red-600 hover:bg-red-50/80 dark:hover:bg-red-950/30",
            )}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {removed ? "Batalkan hapus" : "Hapus gambar"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
