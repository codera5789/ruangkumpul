"use client";

import { useEffect } from "react";

/**
 * Mencatat satu kali view per diskusi per sesi browser. Fire-and-forget.
 */
export function PostViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `rk-post-viewed-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage tidak tersedia — tetap kirim.
    }

    const controller = new AbortController();
    fetch("/api/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Gagal mencatat view tidak boleh mengganggu pembaca.
    });

    return () => controller.abort();
  }, [slug]);

  return null;
}
