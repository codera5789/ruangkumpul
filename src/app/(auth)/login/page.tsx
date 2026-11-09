import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun RuangKumpul kamu dengan email atau Google.",
};

function AuthFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-4 w-40 rounded bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
    </div>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(target);
  }

  return <LoginForm next={target} error={error} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
