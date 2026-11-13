import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDateId } from "@/lib/utils";
import {
  actionSetArticleStatus,
  actionSetCommunityStatus,
  actionSetEventStatus,
  actionSetJobStatus,
  actionSetMarketplaceProductStatus,
  actionToggleToolStatus,
} from "@/modules/admin/actions";
import { AdminFilterTabs } from "@/modules/admin/components/admin-filter-tabs";
import { formatPriceIdr, PRODUCT_STATUS_LABELS } from "@/modules/marketplace/constants";

export const metadata: Metadata = { title: "Admin · Konten Platform" };

type ContentTab = "tools" | "artikel" | "komunitas" | "marketplace" | "event" | "lowongan";

const VALID_TABS = new Set<ContentTab>([
  "tools",
  "artikel",
  "komunitas",
  "marketplace",
  "event",
  "lowongan",
]);

function normalizeTab(raw?: string): ContentTab {
  return VALID_TABS.has(raw as ContentTab) ? (raw as ContentTab) : "tools";
}

export default async function AdminKontenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = normalizeTab(rawTab);
  const supabase = await createClient();

  const tabItems = [
    { label: "Tools", href: "/admin/konten?tab=tools", active: tab === "tools" },
    { label: "Artikel", href: "/admin/konten?tab=artikel", active: tab === "artikel" },
    { label: "Komunitas", href: "/admin/konten?tab=komunitas", active: tab === "komunitas" },
    { label: "Marketplace", href: "/admin/konten?tab=marketplace", active: tab === "marketplace" },
    { label: "Event", href: "/admin/konten?tab=event", active: tab === "event" },
    { label: "Lowongan", href: "/admin/konten?tab=lowongan", active: tab === "lowongan" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Kelola Konten Platform</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Atur visibilitas tools, artikel, komunitas, produk marketplace, event, dan lowongan kerja.
        </p>
      </div>

      <AdminFilterTabs label="Kategori konten admin" items={tabItems} />

      {tab === "tools" ? <ToolsTabContent supabase={supabase} /> : null}
      {tab === "artikel" ? <ArticlesTabContent supabase={supabase} /> : null}
      {tab === "komunitas" ? <CommunitiesTabContent supabase={supabase} /> : null}
      {tab === "marketplace" ? <MarketplaceTabContent supabase={supabase} /> : null}
      {tab === "event" ? <EventsTabContent supabase={supabase} /> : null}
      {tab === "lowongan" ? <JobsTabContent supabase={supabase} /> : null}
    </div>
  );
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function ToolsTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: tools } = await supabase
    .from("tools")
    .select("id, name, slug, status, usage_count, route")
    .order("name")
    .limit(60);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(tools ?? []).map((tool) => (
          <li key={tool.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link href={tool.route} className="text-sm font-semibold text-ink hover:text-brand-800">
                {tool.name}
              </Link>
              <p className="text-xs text-ink-muted">
                /{tool.slug} · {tool.usage_count} kali dipakai
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tool.status === "active" ? "success" : "danger"}>
                {tool.status === "active" ? "Aktif" : "Nonaktif"}
              </Badge>
              <form action={actionToggleToolStatus}>
                <input type="hidden" name="toolId" value={tool.id} />
                <input
                  type="hidden"
                  name="nextStatus"
                  value={tool.status === "active" ? "inactive" : "active"}
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                >
                  {tool.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function ArticlesTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, status, view_count, created_at, profiles (username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(articles ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-ink-secondary">
            Belum ada artikel di database.
          </li>
        ) : (
          (articles ?? []).map((article) => (
            <li key={article.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/artikel/${article.slug}`}
                  className="text-sm font-semibold text-ink hover:text-brand-800"
                >
                  {article.title}
                </Link>
                <p className="text-xs text-ink-muted">
                  @{article.profiles?.username ?? "—"} · {formatDateId(article.created_at)} ·{" "}
                  {article.view_count} dibaca
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    article.status === "published"
                      ? "success"
                      : article.status === "review"
                        ? "warning"
                        : "default"
                  }
                >
                  {article.status}
                </Badge>
                {article.status === "published" ? (
                  <form action={actionSetArticleStatus}>
                    <input type="hidden" name="articleId" value={article.id} />
                    <input type="hidden" name="nextStatus" value="archived" />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                    >
                      Arsipkan
                    </button>
                  </form>
                ) : (
                  <form action={actionSetArticleStatus}>
                    <input type="hidden" name="articleId" value={article.id} />
                    <input type="hidden" name="nextStatus" value="published" />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Terbitkan
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

async function CommunitiesTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, slug, visibility, status, member_count, created_at, profiles (username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(communities ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-ink-secondary">
            Belum ada komunitas di database.
          </li>
        ) : (
          (communities ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/komunitas/${c.slug}`}
                  className="text-sm font-semibold text-ink hover:text-brand-800"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-ink-muted">
                  pemilik @{c.profiles?.username ?? "—"} · {c.visibility} · {c.member_count} anggota
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    c.status === "active"
                      ? "success"
                      : c.status === "suspended"
                        ? "danger"
                        : "default"
                  }
                >
                  {c.status}
                </Badge>
                {(["active", "suspended", "archived"] as const).map((next) => (
                  <form key={next} action={actionSetCommunityStatus}>
                    <input type="hidden" name="communityId" value={c.id} />
                    <input type="hidden" name="nextStatus" value={next} />
                    <button
                      type="submit"
                      disabled={c.status === next}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink disabled:opacity-45"
                    >
                      {next === "active" ? "Aktifkan" : next === "suspended" ? "Tangguhkan" : "Arsipkan"}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

async function MarketplaceTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: products } = await supabase
    .from("marketplace_products")
    .select("id, title, slug, price_idr, status, inquiry_count, created_at, profiles (username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(products ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-ink-secondary">
            Belum ada produk marketplace di database.
          </li>
        ) : (
          (products ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/marketplace/${p.slug}`}
                  className="text-sm font-semibold text-ink hover:text-brand-800"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-ink-muted">
                  kreator @{p.profiles?.username ?? "—"} · {formatPriceIdr(p.price_idr)} ·{" "}
                  {p.inquiry_count} inquiry
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    p.status === "published"
                      ? "success"
                      : p.status === "archived"
                        ? "danger"
                        : "default"
                  }
                >
                  {PRODUCT_STATUS_LABELS[p.status]}
                </Badge>
                {p.status !== "published" ? (
                  <form action={actionSetMarketplaceProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="nextStatus" value="published" />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Tayangkan
                    </button>
                  </form>
                ) : (
                  <form action={actionSetMarketplaceProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="nextStatus" value="archived" />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                    >
                      Arsipkan
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

async function EventsTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, format, status, starts_at, participant_count, profiles (username)")
    .order("starts_at", { ascending: false })
    .limit(50);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(events ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-ink-secondary">
            Belum ada event di database.
          </li>
        ) : (
          (events ?? []).map((ev) => (
            <li key={ev.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/event/${ev.slug}`}
                  className="text-sm font-semibold text-ink hover:text-brand-800"
                >
                  {ev.title}
                </Link>
                <p className="text-xs text-ink-muted">
                  @{ev.profiles?.username ?? "—"} · {ev.format} · {formatDateId(ev.starts_at)} ·{" "}
                  {ev.participant_count} peserta
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    ev.status === "published"
                      ? "success"
                      : ev.status === "cancelled"
                        ? "danger"
                        : "default"
                  }
                >
                  {ev.status}
                </Badge>
                {(["published", "cancelled", "archived"] as const).map((next) => (
                  <form key={next} action={actionSetEventStatus}>
                    <input type="hidden" name="eventId" value={ev.id} />
                    <input type="hidden" name="nextStatus" value={next} />
                    <button
                      type="submit"
                      disabled={ev.status === next}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink disabled:opacity-45"
                    >
                      {next === "published" ? "Tayangkan" : next === "cancelled" ? "Batalkan" : "Arsipkan"}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

async function JobsTabContent({ supabase }: { supabase: ServerSupabase }) {
  const { data: jobs } = await supabase
    .from("job_listings")
    .select("id, company_name, title, slug, job_type, status, created_at, profiles (username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {(jobs ?? []).length === 0 ? (
          <li className="p-6 text-center text-sm text-ink-secondary">
            Belum ada lowongan di database.
          </li>
        ) : (
          (jobs ?? []).map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/karier/${job.slug}`}
                  className="text-sm font-semibold text-ink hover:text-brand-800"
                >
                  {job.title} · {job.company_name}
                </Link>
                <p className="text-xs text-ink-muted">
                  @{job.profiles?.username ?? "—"} · {job.job_type} · {formatDateId(job.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={job.status === "published" ? "success" : "default"}>
                  {job.status === "published" ? "Tayang" : "Ditutup"}
                </Badge>
                <form action={actionSetJobStatus}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={job.status === "published" ? "closed" : "published"}
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                  >
                    {job.status === "published" ? "Tutup" : "Buka lagi"}
                  </button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
