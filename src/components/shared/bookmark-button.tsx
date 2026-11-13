"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { actionToggleBookmark, type BookmarkResourceType } from "@/modules/bookmarks/actions";

interface BookmarkButtonProps {
  resourceType: BookmarkResourceType;
  resourceId: string;
  initialSaved?: boolean;
  /** true/false diketahui server; undefined = cek via Supabase client saat mount. */
  isLoggedIn?: boolean;
  /** "icon" = tombol ikon bulat; "full" = tombol dengan label */
  variant?: "icon" | "full";
  className?: string;
}

/** Tombol simpan/hapus bookmark dengan UI optimistis. */
export function BookmarkButton({
  resourceType,
  resourceId,
  initialSaved,
  isLoggedIn,
  variant = "icon",
  className,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(isLoggedIn);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Halaman statis tidak tahu status login — cek sekali di sisi klien.
  useEffect(() => {
    if (isLoggedIn !== undefined) return;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setLoggedIn(Boolean(data.user)))
      .catch(() => setLoggedIn(false));
  }, [isLoggedIn]);

  // Status bookmark awal belum diketahui (mis. halaman tool statis): baca dari DB
  // agar klik pertama tidak justru menghapus bookmark yang sudah ada.
  useEffect(() => {
    if (initialSaved !== undefined) return;
    let active = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!active || !user) return;
        const { data } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("resource_type", resourceType)
          .eq("resource_id", resourceId)
          .maybeSingle();
        if (active) setSaved(Boolean(data));
      })
      .catch(() => {
        // Biarkan status default; aksi tetap divalidasi server.
      });
    return () => {
      active = false;
    };
  }, [initialSaved, resourceType, resourceId]);

  function handleClick() {
    if (loggedIn === false) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const next = !saved;
    setSaved(next); // optimistis

    startTransition(async () => {
      const res = await actionToggleBookmark(resourceType, resourceId);
      if (res.ok) {
        setSaved(res.saved);
      } else {
        setSaved(!next); // kembalikan jika gagal
        if (res.error === "login") router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });
  }

  const label = saved ? "Tersimpan" : "Simpan";
  const Icon = saved ? BookmarkCheck : Bookmark;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60",
          saved
            ? "border-brand-200 bg-brand-50 text-brand-800"
            : "border-slate-200 bg-surface text-ink-secondary hover:border-brand-300 hover:text-brand-800",
          className,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Hapus dari bookmark" : "Simpan ke bookmark"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-60",
        saved
          ? "bg-brand-50 text-brand-700"
          : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden="true" />
    </button>
  );
}
