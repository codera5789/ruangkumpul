import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  slug: z.string().trim().min(1).max(220),
});

export type ViewCounterConfig =
  | { table: "articles"; rpcName: "increment_article_view"; logTag: string }
  | { table: "posts"; rpcName: "increment_post_view"; logTag: string };

/**
 * Handler bersama untuk endpoint POST pencatat view count publik (artikel & diskusi).
 * Hanya menghitung view untuk konten berstatus `published` dan mengembalikan 404 jika
 * slug tidak ditemukan.
 */
export async function handleViewCountRequest(
  request: Request,
  config: ViewCounterConfig,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Slug wajib diisi" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: row, error: fetchErr } = await supabase
      .from(config.table)
      .select("id")
      .eq("slug", parsed.data.slug)
      .eq("status", "published")
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const { error } =
      config.rpcName === "increment_article_view"
        ? await supabase.rpc("increment_article_view", { article: row.id })
        : await supabase.rpc("increment_post_view", { p_post: row.id });

    if (error) {
      console.error(`${config.logTag} rpc gagal:`, error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`${config.logTag} error:`, err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
