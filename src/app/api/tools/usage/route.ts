import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { visitorKey } from "@/lib/visitor";
import { logToolUsage } from "@/modules/tools/actions";

const bodySchema = z.object({ slug: z.string().trim().min(1).max(100) });

/** POST /api/tools/usage — catat pemakaian tool (fire-and-forget dari klien). */
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
    await logToolUsage(parsed.data.slug, visitorKey(request.headers));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/tools/usage] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
