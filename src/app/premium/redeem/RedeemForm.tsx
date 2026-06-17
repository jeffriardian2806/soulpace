"use client";

import { useActionState } from "react";
import { redeemVoucherAction, type RedeemState } from "../actions";

export function RedeemForm() {
  const [state, formAction, pending] = useActionState<RedeemState | null, FormData>(redeemVoucherAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100">
      <label className="text-xs font-semibold text-ink/65" htmlFor="voucher-code">Kode Voucher</label>
      <input
        id="voucher-code"
        name="code"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="Mis. SOULPACE-2026"
        className="rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm uppercase tracking-wider outline-none focus:border-sky-400"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Redeem"}
      </button>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-semibold">✓ Berhasil!</p>
          {(state.token_granted ?? 0) > 0 && <p>+{state.token_granted} token ditambahkan ke saldo kamu.</p>}
          {(state.days_granted ?? 0) > 0 && <p>+{state.days_granted} hari premium aktif.</p>}
        </div>
      )}
    </form>
  );
}
