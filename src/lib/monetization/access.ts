import { createClient } from "@/lib/supabase/server";

export type AccessResult =
  | { allowed: true; mode: "free" | "subscription" | "token"; cost?: number; premium_until?: string | null; balance_after?: number }
  | { allowed: false; reason: "not_authenticated" | "insufficient_token" | "feature_blocked"; token_cost?: number; token_balance?: number };

/**
 * Atomic check + consume akses ke fitur.
 * Call function ini di server action / route handler tiap user mau akses fitur premium.
 * - Kalau fitur ga premium → log free access, return allowed
 * - Kalau premium dan user punya subscription aktif → return allowed (subscription)
 * - Kalau premium dan token cukup → konsumsi token, return allowed (token)
 * - Kalau premium tapi ga punya akses → return blocked
 */
export async function consumeFeatureAccess(featureSlug: string): Promise<AccessResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_feature_token", { p_feature_slug: featureSlug });
  if (error) return { allowed: false, reason: "feature_blocked" };
  const r = data as Record<string, unknown>;
  if (!r.ok) {
    if (r.error === "not_authenticated") return { allowed: false, reason: "not_authenticated" };
    if (r.error === "insufficient_token") return {
      allowed: false,
      reason: "insufficient_token",
      token_cost: r.token_cost as number,
      token_balance: r.token_balance as number,
    };
    return { allowed: false, reason: "feature_blocked" };
  }
  return {
    allowed: true,
    mode: r.mode as "free" | "subscription" | "token",
    cost: r.cost as number | undefined,
    premium_until: r.premium_until as string | undefined,
    balance_after: r.balance_after as number | undefined,
  };
}

/**
 * Cek status feature flag tanpa konsumsi (read-only, untuk display badge premium dll).
 */
export async function getFeatureFlag(slug: string): Promise<{ is_premium: boolean; token_cost: number; name: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("name, is_premium, token_cost")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ? data as { is_premium: boolean; token_cost: number; name: string } : null;
}

/**
 * Get user's premium status (subscription + token balance).
 */
export async function getUserPremiumStatus(): Promise<{ premium_until: string | null; token_balance: number } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("premium_until, token_balance")
    .eq("id", user.id)
    .single();
  return data ? data as { premium_until: string | null; token_balance: number } : null;
}

/**
 * User redeem voucher.
 */
export async function redeemVoucher(code: string): Promise<{ ok: boolean; error?: string; token_granted?: number; days_granted?: number; premium_until?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_voucher", { p_code: code });
  if (error) return { ok: false, error: error.message };
  const r = data as Record<string, unknown>;
  if (!r.ok) return { ok: false, error: r.error as string };
  return {
    ok: true,
    token_granted: r.token_granted as number,
    days_granted: r.days_granted as number,
    premium_until: r.premium_until as string | undefined,
  };
}
