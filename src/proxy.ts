import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Semua route kecuali:
     * - _next/static, _next/image (aset build)
     * - favicon.ico, sitemap.xml, robots.txt, sw.js
     * - file gambar statis (svg, png, jpg, dst.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
