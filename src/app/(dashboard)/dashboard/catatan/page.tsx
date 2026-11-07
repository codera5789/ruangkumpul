import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NotesList } from "@/modules/productivity/components/notes-list";

export const metadata: Metadata = { title: "Catatan" };

export default async function CatatanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/catatan");

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
          <NotebookPen className="size-6 text-brand-700" aria-hidden="true" />
          Catatan
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Ruang pribadimu — catatan hanya bisa dilihat oleh kamu.
        </p>
      </div>

      <NotesList notes={notes ?? []} />
    </div>
  );
}
