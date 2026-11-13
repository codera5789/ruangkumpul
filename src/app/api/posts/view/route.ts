import { handleViewCountRequest } from "@/lib/view-counter";

/** POST /api/posts/view — catat satu kali view diskusi per sesi. */
export async function POST(request: Request) {
  return handleViewCountRequest(request, {
    table: "posts",
    rpcName: "increment_post_view",
    logTag: "[api/posts/view]",
  });
}
