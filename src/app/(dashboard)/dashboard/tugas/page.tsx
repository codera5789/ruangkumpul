import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TasksBoard } from "@/modules/productivity/components/tasks-board";

export const metadata: Metadata = { title: "Tugas" };

export default async function TugasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/tugas");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .limit(200);

  const all = tasks ?? [];
  const doneCount = all.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink">
          <ListTodo className="size-6 text-brand-700" aria-hidden="true" />
          Tugas
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {all.length > 0
            ? `${doneCount} dari ${all.length} tugas selesai.`
            : "Atur pekerjaanmu: perlu dikerjakan, sedang dikerjakan, selesai."}
        </p>
      </div>

      <TasksBoard tasks={all} />
    </div>
  );
}
