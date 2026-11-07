import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { ChangePasswordForm } from "@/modules/users/components/change-password-form";
import { ChangeEmailForm } from "@/modules/users/components/change-email-form";
import { NotificationPrefsForm } from "@/modules/users/components/notification-prefs-form";
import { DeleteAccountSection } from "@/modules/users/components/delete-account-section";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/pengaturan");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("notify_comments, notify_likes, notify_mentions, notify_product")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pengaturan</h1>
        <p className="mt-1 text-sm text-ink-secondary">Kelola akun, keamanan, dan notifikasi kamu.</p>
      </div>

      <section
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="ubah-email"
      >
        <h2 id="ubah-email" className="text-lg font-extrabold text-ink">
          Ganti email
        </h2>
        <p className="mt-1 mb-5 text-sm text-ink-secondary">
          Email saat ini: <strong className="text-ink">{user.email}</strong>. Kami akan mengirim
          tautan konfirmasi ke alamat baru.
        </p>
        <ChangeEmailForm currentEmail={user.email ?? ""} />
      </section>

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
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="preferensi-notifikasi"
      >
        <h2 id="preferensi-notifikasi" className="text-lg font-extrabold text-ink">
          Notifikasi
        </h2>
        <p className="mt-1 mb-5 text-sm text-ink-secondary">
          Pilih aktivitas yang ingin diberi tahu.
        </p>
        <NotificationPrefsForm
          defaults={{
            notifyComments: settings?.notify_comments ?? true,
            notifyLikes: settings?.notify_likes ?? true,
            notifyMentions: settings?.notify_mentions ?? true,
            notifyProduct: settings?.notify_product ?? true,
          }}
        />
      </section>

      <section
        className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="info-akun"
      >
        <h2 id="info-akun" className="text-lg font-extrabold text-ink">
          Informasi akun
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
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

      <section
        className="rounded-card border border-red-200 bg-red-50/40 p-6 shadow-card sm:p-8"
        aria-labelledby="zona-bahaya"
      >
        <h2 id="zona-bahaya" className="flex items-center gap-2 text-lg font-extrabold text-red-700">
          <TriangleAlert className="size-5" aria-hidden="true" />
          Zona bahaya
        </h2>
        <div className="mt-4">
          <DeleteAccountSection />
        </div>
      </section>
    </div>
  );
}
