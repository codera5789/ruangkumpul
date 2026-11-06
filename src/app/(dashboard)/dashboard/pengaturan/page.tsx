import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChangePasswordForm } from "@/modules/users/components/change-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/pengaturan");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pengaturan</h1>
        <p className="mt-1 text-sm text-ink-secondary">Kelola keamanan akun kamu.</p>
      </div>

      <section
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="ubah-password"
      >
        <h2 id="ubah-password" className="text-lg font-extrabold text-ink">
          Ubah password
        </h2>
        <p className="mt-1 mb-5 text-sm text-ink-secondary">
          Gunakan password kuat yang belum pernah dipakai di situs lain.
        </p>
        <ChangePasswordForm />
      </section>

      <section
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card"
        aria-labelledby="info-akun"
      >
        <h2 id="info-akun" className="text-lg font-extrabold text-ink">
          Informasi akun
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-secondary">Email</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-secondary">Metode daftar</dt>
            <dd className="font-medium capitalize text-ink">
              {user.app_metadata?.provider ?? "email"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-secondary">Bergabung sejak</dt>
            <dd className="font-medium text-ink">
              {user.created_at
                ? new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "long",
                    timeZone: "Asia/Jakarta",
                  }).format(new Date(user.created_at))
                : "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
