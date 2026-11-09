import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, UserCheck, UserMinus, UserX, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, timeAgoId } from "@/lib/utils";
import {
  actionApproveMember,
  actionRejectMember,
  actionRemoveMember,
  actionSetMemberRole,
} from "@/modules/community/actions";

export const metadata: Metadata = { title: "Kelola Anggota" };

type MemberRow = {
  id: string;
  user_id: string;
  role: "owner" | "moderator" | "member";
  status: "pending" | "approved" | "banned";
  joined_at: string;
  profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
};

async function AnggotaContent({ slug }: { slug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/komunitas/${slug}/anggota`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug, owner_id, visibility")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  // Hanya owner/moderator yang boleh membuka halaman ini.
  const { data: myMembership } = await supabase
    .from("community_members")
    .select("role, status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  const isOwner = community.owner_id === user.id;
  const isModerator = myMembership?.role === "moderator" && myMembership?.status === "approved";

  if (!isOwner && !isModerator) redirect(`/komunitas/${slug}`);

  const { data: members } = await supabase
    .from("community_members")
    .select("id, user_id, role, status, joined_at, profiles (username, full_name, avatar_url)")
    .eq("community_id", community.id)
    .order("joined_at", { ascending: true })
    .limit(500);

  const rows = (members ?? []) as MemberRow[];
  const pending = rows.filter((m) => m.status === "pending");
  const approved = rows.filter((m) => m.status === "approved");

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/komunitas/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke {community.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Kelola Anggota</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {approved.length} anggota aktif
            {pending.length > 0 ? ` · ${pending.length} menunggu persetujuan` : ""}
          </p>
        </div>
        {community.visibility === "private" ? <Badge variant="outline">Komunitas Privat</Badge> : null}
      </div>

      {/* Permintaan gabung */}
      <section className="mt-6" aria-labelledby="pending-anggota">
        <h2 id="pending-anggota" className="text-lg font-extrabold text-ink">
          Menunggu Persetujuan ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-card border border-dashed border-slate-300 bg-surface px-5 py-8 text-center text-sm text-ink-secondary">
            Tidak ada permintaan gabung.
          </p>
        ) : (
          <Card className="mt-3">
            <ul className="divide-y divide-slate-100">
              {pending.map((m) => {
                const name = m.profiles?.full_name || m.profiles?.username || "Pengguna";
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                    <Avatar src={m.profiles?.avatar_url} name={name} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/pengguna/${m.profiles?.username}`}
                        className="truncate text-sm font-semibold text-ink hover:underline"
                      >
                        {name}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        meminta gabung {timeAgoId(m.joined_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={actionApproveMember}>
                        <input type="hidden" name="communitySlug" value={slug} />
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" size="sm">
                          <UserCheck className="size-4" aria-hidden="true" />
                          Setujui
                        </Button>
                      </form>
                      <form action={actionRejectMember}>
                        <input type="hidden" name="communitySlug" value={slug} />
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <UserX className="size-4" aria-hidden="true" />
                          Tolak
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      {/* Anggota aktif */}
      <section className="mt-8" aria-labelledby="anggota-aktif">
        <h2 id="anggota-aktif" className="text-lg font-extrabold text-ink">
          Anggota Aktif ({approved.length})
        </h2>
        <Card className="mt-3">
          <ul className="divide-y divide-slate-100">
            {approved.map((m) => {
              const name = m.profiles?.full_name || m.profiles?.username || "Pengguna";
              const isRowOwner = m.role === "owner";
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Avatar src={m.profiles?.avatar_url} name={name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pengguna/${m.profiles?.username}`}
                      className="truncate text-sm font-semibold text-ink hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      bergabung {formatDateId(m.joined_at, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {isRowOwner ? (
                    <Badge variant="brand">
                      <Users className="size-3" aria-hidden="true" />
                      Owner
                    </Badge>
                  ) : m.role === "moderator" ? (
                    <Badge variant="warning">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      Moderator
                    </Badge>
                  ) : null}

                  {!isRowOwner ? (
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <form action={actionSetMemberRole}>
                          <input type="hidden" name="communitySlug" value={slug} />
                          <input type="hidden" name="memberId" value={m.id} />
                          <input
                            type="hidden"
                            name="nextRole"
                            value={m.role === "moderator" ? "member" : "moderator"}
                          />
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                          >
                            {m.role === "moderator" ? "Jadikan anggota" : "Jadikan moderator"}
                          </button>
                        </form>
                      ) : null}
                      <form action={actionRemoveMember}>
                        <input type="hidden" name="communitySlug" value={slug} />
                        <input type="hidden" name="memberId" value={m.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <UserMinus className="size-3.5" aria-hidden="true" />
                          Keluarkan
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}

export default function AnggotaKomunitasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><div className="h-96 animate-pulse rounded-card bg-slate-200/50" /></div>}>
      <AnggotaWrapper params={params} />
    </Suspense>
  );
}

async function AnggotaWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AnggotaContent slug={slug} />;
}
