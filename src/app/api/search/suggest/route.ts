import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TOOLS } from "@/modules/tools/tools-registry/registry";

/** GET /api/search/suggest?q=... — saran pencarian campuran (maks. 8). */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  if (q.length < 2 || q.length > 80) {
    return NextResponse.json({ results: [] });
  }

  try {
    const supabase = await createClient();
    const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

    const [articles, communities] = await Promise.all([
      supabase
        .from("articles")
        .select("title, slug")
        .eq("status", "published")
        .ilike("title", pattern)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(4),
      supabase
        .from("communities")
        .select("name, slug")
        .eq("visibility", "public")
        .eq("status", "active")
        .ilike("name", pattern)
        .order("member_count", { ascending: false })
        .limit(3),
    ]);

    const toolHits = TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)),
    )
      .slice(0, 4)
      .map((t) => ({ type: "tool" as const, title: t.name, href: t.route }));

    const results = [
      ...toolHits,
      ...(articles.data ?? []).map((a) => ({
        type: "article" as const,
        title: a.title,
        href: `/artikel/${a.slug}`,
      })),
      ...(communities.data ?? []).map((c) => ({
        type: "community" as const,
        title: c.name,
        href: `/komunitas/${c.slug}`,
      })),
    ].slice(0, 8);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/search/suggest] error:", err);
    return NextResponse.json({ results: [] });
  }
}
