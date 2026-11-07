import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AvatarUploadForm } from "@/modules/users/components/avatar-upload-form";
import { ProfileForm } from "@/modules/users/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil Saya" };

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, bio, website_url, location")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Profil saya</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Informasi ini tampil di halaman publik dan komentar kamu.
        </p>
      </div>

      <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8">
        <AvatarUploadForm currentUrl={profile.avatar_url} name={profile.full_name || profile.username} />
      </div>

      <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8">
        <ProfileForm
          defaults={{
            username: profile.username,
            fullName: profile.full_name ?? "",
            bio: profile.bio ?? "",
            websiteUrl: profile.website_url ?? "",
            location: profile.location ?? "",
          }}
        />
      </div>

      <p className="text-xs text-ink-muted">
        Email akun: {user.email}, perubahan email tersedia di{" "}
        <a href="/dashboard/pengaturan" className="font-semibold text-brand-700 hover:underline">
          Pengaturan
        </a>
        .
      </p>
    </div>
  );
}
