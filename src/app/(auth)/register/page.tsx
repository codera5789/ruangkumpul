import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun RuangKumpul gratis: satu akun untuk semua kebutuhan digital.",
};

function AuthFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
    </div>
  );
}

async function RegisterContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}
