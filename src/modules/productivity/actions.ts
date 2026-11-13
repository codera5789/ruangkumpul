"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isUuid, type ActionState } from "@/lib/form";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export type ProductivityActionState = ActionState;

// ---------------------------------------------------------------------------
// Catatan
// ---------------------------------------------------------------------------

const noteSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200).default("Catatan tanpa judul"),
  content: z.string().max(50000).default(""),
  pinned: z.boolean().default(false),
});

export async function actionSaveNote(formData: FormData): Promise<void> {
  const parsed = noteSchema.safeParse({
    id: formData.get("id") || "",
    title: formData.get("title") || "Catatan tanpa judul",
    content: formData.get("content") || "",
    pinned: formData.get("pinned") === "on",
  });

  if (!parsed.success) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const values = {
    title: parsed.data.title,
    content: parsed.data.content,
    pinned: parsed.data.pinned,
  };

  if (parsed.data.id) {
    // RLS: hanya milik sendiri yang bisa di-update.
    await supabase.from("notes").update(values).eq("id", parsed.data.id);
  } else {
    await supabase.from("notes").insert({ user_id: user.id, ...values });
  }

  revalidatePath("/dashboard/catatan");
}

export async function actionDeleteNote(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!isUuid(id)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/dashboard/catatan");
}

export async function actionToggleNotePin(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const nextPinned = formData.get("nextPinned") === "true";
  if (!isUuid(id)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from("notes").update({ pinned: nextPinned }).eq("id", id);
  revalidatePath("/dashboard/catatan");
}

// ---------------------------------------------------------------------------
// Tugas
// ---------------------------------------------------------------------------

const taskSchema = z.object({
  title: z.string().trim().min(2, "Judul tugas minimal 2 karakter").max(200),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export async function actionCreateTask(formData: FormData): Promise<void> {
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  try {
    await enforceRateLimit(`task-create:${user.id}`, 30, 60);
  } catch {
    return;
  }

  await supabase.from("tasks").insert({
    user_id: user.id,
    title: parsed.data.title,
    due_date: parsed.data.dueDate || null,
    status: "todo",
    position: Date.now() % 1_000_000, // urutan stabil tanpa query tambahan
  });

  revalidatePath("/dashboard/tugas");
}

export async function actionMoveTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const nextStatus = String(formData.get("nextStatus") || "");

  if (!isUuid(id)) return;
  if (nextStatus !== "todo" && nextStatus !== "doing" && nextStatus !== "done") return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/dashboard/tugas");
}

export async function actionDeleteTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!isUuid(id)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/dashboard/tugas");
}
