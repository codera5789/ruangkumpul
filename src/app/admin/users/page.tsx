import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { parsePageParam } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, postgrestIlikePattern } from "@/lib/utils";
import { actionToggleNewsletterSubscriber } from "@/modules/admin/actions";
import { AdminFilterTabs } from "@/modules/admin/components/admin-filter-tabs";
import { UserRoleManager } from "@/modules/admin/components/user-role-manager";

export const metadata: Metadata = { title: "Admin · Pengguna & Newsletter" };

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tab?: string }>;
}) {
  const { q, page: pageParam, tab: rawTab } = await searchParams;
  const tab = rawTab === "newsletter" ? "newsletter" : "pengguna";
  const page = parsePageParam(pageParam);
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const [
    { count: userTotalCount },
    { count: subscriberActiveCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const filterTabs = [
    {
      label: "Pengguna Terdaftar",
      href: "/admin/users",
      active: tab === "pengguna",
      count: userTotalCount ?? 0,
    },
    {
      label: "Pelanggan Newsletter",
      href: "/admin/users?tab=newsletter",
      active: tab === "newsletter",
      count: subscriberActiveCount ?? 0,
    },
  ];

  if (tab === "newsletter") {
    let subReq = supabase
      .from("newsletter_subscribers")
      .select("id, email, source, is_active, subscribed_at, unsubscribed_at", {
        count: "exact",
      })
      .order("subscribed_at", { ascending: false });

    if (query.length >= 2) {
      subReq = subReq.ilike("email", `%${query}%`);
    }

    const { data: subscribers, count: subCount, error: subError } = await subReq.range(
      from,
      from + PAGE_SIZE - 1,
    );
    if (subError) console.error("[admin/users] newsletter query gagal:", subError.message);
    const totalPages = Math.max(1, Math.ceil((subCount ?? 0) / PAGE_SIZE));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Pengguna &amp; Newsletter
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {subCount ?? 0} alamat email terdaftar di buletin RuangKumpul.
          </p>
        </div>

        <AdminFilterTabs label="Mode pengguna" items={filterTabs} />

        <form action="/admin/users" method="GET" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value="newsletter" />
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Cari alamat email..."
              aria-label="Cari pelanggan newsletter"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Cari
          </Button>
          {query ? (
            <Link
              href="/admin/users?tab=newsletter"
              className="rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              Reset
            </Link>
          ) : null}
        </form>

        <Card>
          {(subscribers ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-secondary">
              Belum ada pelanggan newsletter yang cocok.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(subscribers ?? []).map((sub) => (
                <li
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{sub.email}</p>
                    <p className="text-xs text-ink-muted">
                      sumber: {sub.source} · daftar {formatDateId(sub.subscribed_at)}
                      {sub.unsubscribed_at
                        ? ` · berhenti ${formatDateId(sub.unsubscribed_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sub.is_active ? "success" : "default"}>
                      {sub.is_active ? "Aktif" : "Berhenti"}
                    </Badge>
                    <form action={actionToggleNewsletterSubscriber}>
                      <input type="hidden" name="subscriberId" value={sub.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={sub.is_active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:text-ink"
                      >
                        {sub.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/users"
          query={{ tab: "newsletter", ...(query ? { q: query } : {}) }}
        />
      </div>
    );
  }

  let request = supabase
    .from("profiles")
    .select(
      `id, username, full_name, avatar_url, is_verified, created_at,
       user_roles (role)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (query.length >= 2) {
    const pattern = postgrestIlikePattern(query);
    request = request.or(`username.ilike.${pattern},full_name.ilike.${pattern}`);
  }

  const { data: users, count, error: usersError } = await request.range(
    from,
    from + PAGE_SIZE - 1,
  );
  if (usersError) console.error("[admin/users] query gagal:", usersError.message);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Role milik admin yang sedang login (untuk membatasi UI).
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  const { data: actorRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", actor?.id ?? "");
  const isSuper = (actorRoles ?? []).some((r) => r.role === "super_admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Pengguna &amp; Newsletter
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {count ?? 0} akun terdaftar. Kelola role dengan hati-hati: setiap perubahan tercatat di
          audit log.
        </p>
      </div>

      <AdminFilterTabs label="Mode pengguna" items={filterTabs} />

      <form action="/admin/users" method="GET" className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Cari nama atau username..."
            aria-label="Cari pengguna"
          />
        </div>
        <Button type="submit" variant="secondary" size="md">
          Cari
        </Button>
        {query ? (
          <Link
            href="/admin/users"
            className="rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <Card>
        <ul className="divide-y divide-slate-100">
          {(users ?? []).map((u) => (
            <li key={u.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {u.full_name || u.username}
                    {u.is_verified ? <Badge variant="brand">Terverifikasi</Badge> : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    @{u.username} · bergabung {formatDateId(u.created_at)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(u.user_roles ?? []).length > 0 ? (
                      (u.user_roles ?? []).map((r) => (
                        <Badge key={r.role} variant="outline" className="text-[10px]">
                          {r.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="default" className="text-[10px]">
                        user
                      </Badge>
                    )}
                  </div>
                </div>
                <UserRoleManager
                  userId={u.id}
                  roles={(u.user_roles ?? []).map((r) => r.role)}
                  isSuperAdmin={isSuper}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/users"
        query={query ? { q: query } : undefined}
      />
    </div>
  );
}
