import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { TOOLS } from "@/modules/tools/tools-registry/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/artikel`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/komunitas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/event`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/karier`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/jelajahi`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/tentang`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/kontak`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/panduan`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privasi`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/syarat`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/register`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${base}${tool.route}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Konten dinamis dari database — gagal koneksi tidak boleh merusak sitemap.
  let articleRoutes: MetadataRoute.Sitemap = [];
  let communityRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];
  let jobRoutes: MetadataRoute.Sitemap = [];

  try {
    const { createPublicClient } = await import("@/lib/supabase/public");
    const supabase = createPublicClient();

    const [{ data: articles }, { data: communities }, { data: events }, { data: jobs }] =
      await Promise.all([
        supabase
          .from("articles")
          .select("slug, updated_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(5000),
        supabase
          .from("communities")
          .select("slug, created_at")
          .eq("visibility", "public")
          .eq("status", "active")
          .limit(5000),
        supabase
          .from("events")
          .select("slug, updated_at")
          .eq("status", "published")
          .order("starts_at", { ascending: false })
          .limit(2000),
        supabase
          .from("job_listings")
          .select("slug, updated_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

    articleRoutes = (articles ?? []).map((a) => ({
      url: `${base}/artikel/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    communityRoutes = (communities ?? []).map((c) => ({
      url: `${base}/komunitas/${c.slug}`,
      lastModified: c.created_at ? new Date(c.created_at) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));

    eventRoutes = (events ?? []).map((e) => ({
      url: `${base}/event/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    jobRoutes = (jobs ?? []).map((j) => ({
      url: `${base}/karier/${j.slug}`,
      lastModified: j.updated_at ? new Date(j.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("[sitemap] gagal memuat konten dinamis:", err);
  }

  return [
    ...staticRoutes,
    ...toolRoutes,
    ...articleRoutes,
    ...communityRoutes,
    ...eventRoutes,
    ...jobRoutes,
  ];
}
