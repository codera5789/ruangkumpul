"use client";

import { useActionState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import { actionCreateInquiry, type MarketplaceActionState } from "@/modules/marketplace/actions";

const initialState: MarketplaceActionState = { error: null, success: null };

/** Form pengiriman pesan inquiry pembeli ke kreator produk. */
export function InquiryForm({
  productId,
  defaultName,
}: {
  productId: string;
  defaultName?: string;
}) {
  const [state, formAction] = useActionState(actionCreateInquiry, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <div>
        <label htmlFor="buyerName" className="mb-1 block text-xs font-semibold text-ink-secondary">
          Nama kamu *
        </label>
        <Input
          id="buyerName"
          name="buyerName"
          required
          minLength={2}
          maxLength={120}
          defaultValue={defaultName ?? ""}
          placeholder="Nama lengkap"
        />
        {state.fieldErrors?.buyerName ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.buyerName}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="buyerContact" className="mb-1 block text-xs font-semibold text-ink-secondary">
          Kontak yang bisa dihubungi *
        </label>
        <Input
          id="buyerContact"
          name="buyerContact"
          required
          minLength={4}
          maxLength={160}
          placeholder="Email, WhatsApp, atau Telegram"
        />
        {state.fieldErrors?.buyerContact ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.buyerContact}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-xs font-semibold text-ink-secondary">
          Pesan untuk kreator *
        </label>
        <Textarea
          id="message"
          name="message"
          required
          rows={4}
          minLength={10}
          maxLength={2000}
          placeholder="Tanyakan detail lisensi, kustomisasi, atau mekanisme pemesanan..."
        />
        {state.fieldErrors?.message ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.message}</p>
        ) : null}
      </div>

      <SubmitButton pendingText="Mengirim..." className="w-full">
        Kirim Inquiry
      </SubmitButton>
    </form>
  );
}
