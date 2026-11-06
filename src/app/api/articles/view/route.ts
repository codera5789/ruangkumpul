import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ slug: z.string().trim().min(1).max(220) });

/** POST /api/articles/view — catat satu kali view artikel per sesi. */
export async function POST(request: NextRequest) {
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

    // Cari id artikel (hanya published yang terlihat publik).
    const { data: article, error: fetchErr } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", parsed.data.slug)
      .eq("status", "published")
      .single();

    if (fetchErr || !article) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const { error } = await supabase.rpc("increment_article_view", {
      article: article.id,
    });

    if (error) {
      console.error("[api/articles/view] rpc gagal:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/articles/view] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
