"use client";

import { Star } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { actionToggleToolFavorite } from "@/modules/tools/actions";

interface ToolFavoriteButtonProps {
  toolSlug: string;
  className?: string;
}

/** Tombol favorit tool — status di-resolve klien (aman untuk halaman statis). */
export function ToolFavoriteButton({ toolSlug, className }: ToolFavoriteButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        setLoggedIn(Boolean(data.user));
        if (!data.user) return;
        // Cek status favorit awal via API ringan: coba toggle-detect tidak ada —
        // gunakan query tabel langsung.
        const { data: fav } = await supabase
          .from("tool_favorites")
          .select("id, tools!inner (slug)")
          .eq("tools.slug", toolSlug)
          .maybeSingle();
        setSaved(Boolean(fav));
      })
      .catch(() => setLoggedIn(false));
  }, [toolSlug]);

  function handleClick() {
    if (loggedIn === false) {
      router.push(`/login?next=/tools/${toolSlug}`);
      return;
    }

    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const res = await actionToggleToolFavorite(toolSlug);
      setSaved(res.ok ? res.saved : !next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Hapus dari favorit" : "Tambahkan ke favorit"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-60",
        saved
          ? "bg-amber-100 text-amber-600"
          : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      <Star className={cn("size-4.5", saved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
