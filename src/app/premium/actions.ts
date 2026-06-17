"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redeemVoucher } from "@/lib/monetization/access";

export type RedeemState = {
  ok: boolean;
  error?: string;
  token_granted?: number;
  days_granted?: number;
  premium_until?: string;
};

export async function redeemVoucherAction(_prev: RedeemState | null, formData: FormData): Promise<RedeemState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium/redeem");

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { ok: false, error: "Kode voucher wajib." };

  const r = await redeemVoucher(code);
  if (!r.ok) {
    const msg: Record<string, string> = {
      voucher_not_found: "Kode voucher tidak ditemukan atau sudah tidak aktif.",
      voucher_expired: "Voucher sudah kadaluarsa.",
      voucher_full: "Voucher sudah mencapai batas pemakaian.",
      already_redeemed: "Kamu sudah pernah pakai voucher ini.",
      not_authenticated: "Sesi habis, silakan login ulang.",
    };
    return { ok: false, error: msg[r.error ?? ""] ?? r.error ?? "Gagal redeem voucher." };
  }

  revalidatePath("/premium/redeem");
  revalidatePath("/profile");
  revalidatePath("/feed");
  return {
    ok: true,
    token_granted: r.token_granted,
    days_granted: r.days_granted,
    premium_until: r.premium_until,
  };
}
