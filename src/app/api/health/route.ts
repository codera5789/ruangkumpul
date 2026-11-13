import { NextResponse, connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Health check: verifikasi kesiapan layanan + konektivitas database.
 * Dipakai monitoring/uptime checker; tidak mengungkap data apa pun.
 */
export async function GET() {
  await connection();

  try {
    const supabase = createPublicClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("[health] database tidak siap:", error.message);
      return NextResponse.json(
        { status: "degraded", database: "unreachable" },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok", database: "reachable" });
  } catch (err) {
    console.error("[health] error tak terduga:", err);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
