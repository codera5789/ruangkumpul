"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { actionSubscribeNewsletter, type NewsletterActionState } from "@/modules/newsletter/actions";

const initialState: NewsletterActionState = { error: null, success: null };

/** Form langganan newsletter (footer). */
export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [state, formAction, pending] = useActionState(actionSubscribeNewsletter, initialState);

  return (
    <div>
      {state.success ? (
        <p className="text-sm font-semibold text-emerald-400" role="status">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="source" value={source} />
          <input
            type="email"
            name="email"
            required
            maxLength={255}
            placeholder="email@kamu.com"
            aria-label="Alamat email"
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 text-sm text-white placeholder:text-white/50 focus:border-white/50 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Berlangganan"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      )}
      {state.error ? (
        <p className="mt-1.5 text-xs text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
