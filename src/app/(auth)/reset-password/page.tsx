import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/modules/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "Password Baru",
  description: "Buat password baru untuk akun RuangKumpul kamu.",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Buat password baru</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Pilih password yang kuat dan belum pernah kamu gunakan sebelumnya.
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
