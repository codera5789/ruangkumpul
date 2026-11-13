import { handleViewCountRequest } from "@/lib/view-counter";

/** POST /api/articles/view — catat satu kali view artikel per sesi. */
export async function POST(request: Request) {
  return handleViewCountRequest(request, {
    table: "articles",
    rpcName: "increment_article_view",
    logTag: "[api/articles/view]",
  });
}
