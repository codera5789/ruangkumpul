import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserRoleManager } from "@/modules/admin/components/user-role-manager";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, postgrestIlikePattern } from "@/lib/utils";
import { parsePageParam } from "@/lib/form";

export const metadata: Metadata = { title: "Admin · Pengguna" };

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const query = (q ?? "").trim();

  const supabase = await createClient();

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

  const from = (page - 1) * PAGE_SIZE;
  const { data: users, count, error: usersError } = await request.range(from, from + PAGE_SIZE - 1);
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
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pengguna</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {count ?? 0} akun terdaftar. Kelola role dengan hati-hati: setiap
          perubahan tercatat di audit log.
        </p>
      </div>

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

      {totalPages > 1 ? (
        <nav aria-label="Navigasi halaman" className="flex justify-center gap-3 text-sm">
          {page > 1 ? (
            <a
              href={`/admin/users?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className="rounded-lg border border-slate-200 bg-surface px-4 py-2 font-semibold text-ink-secondary hover:text-ink"
            >
              ← Sebelumnya
            </a>
          ) : null}
          <span className="py-2 text-ink-secondary">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages ? (
            <a
              href={`/admin/users?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className="rounded-lg border border-slate-200 bg-surface px-4 py-2 font-semibold text-ink-secondary hover:text-ink"
            >
              Selanjutnya →
            </a>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
