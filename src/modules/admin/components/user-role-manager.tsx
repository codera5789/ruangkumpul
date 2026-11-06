"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/types/database";
import { actionSetUserRole, type AdminActionState } from "@/modules/admin/actions";

const initialState: AdminActionState = { error: null, success: null };

const ALL_ROLES: Enums["user_role"][] = [
  "contributor",
  "moderator",
  "admin",
  "super_admin",
];

function RoleSubmit({ role, action, active }: { role: string; action: "add" | "remove"; active: boolean }) {
  const { pending } = useFormStatus();
  if (pending) {
    return (
      <Button type="submit" size="sm" variant={active ? "danger" : "secondary"} disabled>
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      </Button>
    );
  }
  return (
    <Button type="submit" size="sm" variant={active ? "danger" : "secondary"}>
      {active ? "Hapus" : "Tambah"}
      <span className="sr-only">{role}</span>
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="action" value={action} />
    </Button>
  );
}

export function UserRoleManager({
  userId,
  roles,
  isSuperAdmin,
}: {
  userId: string;
  roles: Enums["user_role"][];
  isSuperAdmin: boolean;
}) {
  const [state, formAction] = useActionState(actionSetUserRole, initialState);
  const rolesForUI = isSuperAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "admin" && r !== "super_admin");

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold text-ink-secondary hover:text-ink">
        <ShieldCheck className="size-4" aria-hidden="true" />
        Kelola role
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </summary>

      <form action={formAction} className="mt-2 w-56 rounded-xl border border-slate-200 bg-surface p-3 shadow-lg">
        <input type="hidden" name="userId" value={userId} />

        {state.error ? (
          <p role="alert" className="mb-2 text-xs text-red-600">{state.error}</p>
        ) : null}
        {state.success ? (
          <p role="status" className="mb-2 text-xs text-emerald-700">{state.success}</p>
        ) : null}

        <ul className="space-y-1.5">
          {rolesForUI.map((role) => {
            const active = roles.includes(role);
            return (
              <li key={role} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize text-ink">{role}</span>
                <RoleSubmit role={role} action={active ? "remove" : "add"} active={active} />
              </li>
            );
          })}
        </ul>

        {!isSuperAdmin ? (
          <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-ink-muted">
            Role admin hanya dapat diatur super admin.
          </p>
        ) : null}
      </form>
    </details>
  );
}
