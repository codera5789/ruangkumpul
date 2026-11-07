import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ slug: z.string().trim().min(1).max(220) });

/** POST /api/posts/view — catat satu kali view diskusi per sesi. */
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

    const { data: post, error: fetchErr } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", parsed.data.slug)
      .eq("status", "published")
      .single();

    if (fetchErr || !post) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const { error } = await supabase.rpc("increment_post_view", {
      p_post: post.id,
    });

    if (error) {
      console.error("[api/posts/view] rpc gagal:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/posts/view] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
