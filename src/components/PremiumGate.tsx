import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side helper: cek akses fitur premium tanpa wrap children.
 * Pakai di awal page server component:
 *
 *   const blocked = await checkPremiumAccess("spektrum");
 *   if (blocked) return blocked;
 *
 * Returns ReactElement (PremiumBlocked) kalau ke-block, null kalau ke-allow.
 * Cuma cek READ-only — token consumption dilakukan terpisah via consume_feature_token RPC saat user submit hasil.
 */
export async function checkPremiumAccess(slug: string): Promise<ReactElement | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: flag } = await supabase
    .from("feature_flags")
    .select("is_premium, token_cost, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  // Fitur ga registered atau ga premium → langsung allow
  if (!flag || !flag.is_premium) return null;

  // Guest → block dengan prompt login
  if (!user) return <PremiumBlocked slug={slug} name={flag.name} tokenCost={flag.token_cost} reason="login" />;

  // Cek profile status
  const { data: profile } = await supabase
    .from("profiles")
    .select("premium_until, token_balance")
    .eq("id", user.id)
    .single();

  const premiumActive = !!profile?.premium_until && new Date(profile.premium_until) > new Date();
  if (premiumActive) return null;

  if ((profile?.token_balance ?? 0) >= flag.token_cost) return null;

  return <PremiumBlocked slug={slug} name={flag.name} tokenCost={flag.token_cost} balance={profile?.token_balance ?? 0} reason="insufficient" />;
}

/**
 * Component wrapper alias buat backward-compat. Same logic as checkPremiumAccess but wraps children.
 */
export async function PremiumGate({ slug, children }: { slug: string; children: ReactNode }) {
  const blocked = await checkPremiumAccess(slug);
  if (blocked) return blocked;
  return <>{children}</>;
}

function PremiumBlocked({ slug, name, tokenCost, balance, reason }: { slug: string; name: string; tokenCost: number; balance?: number; reason: "login" | "insufficient" }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-purple-100 to-rose-100 p-6 ring-1 ring-purple-200">
        <p className="text-3xl">💎</p>
        <p className="mt-2 text-lg font-bold text-ink">{name} — Fitur Premium</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          {reason === "login"
            ? "Login dulu buat akses fitur ini."
            : `Fitur ini butuh ${tokenCost} token per akses, atau premium aktif. Saldo token kamu sekarang: ${balance}.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={reason === "login" ? `/login?next=/${slug}` : "/premium/redeem"} className="rounded-full bg-gradient-to-br from-sky-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white">
            {reason === "login" ? "Login" : "💎 Redeem voucher"}
          </Link>
          <Link href="/feed" className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-200">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}

/**
 * Server fetch — bikin Map slug→flag biar hub pages (/main, /skrining) bisa pre-fetch & render badge tanpa N+1 query.
 */
export async function getFeatureFlagMap(): Promise<Map<string, { is_premium: boolean; token_cost: number }>> {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("slug, is_premium, token_cost").eq("is_active", true);
  const map = new Map<string, { is_premium: boolean; token_cost: number }>();
  ((data ?? []) as { slug: string; is_premium: boolean; token_cost: number }[]).forEach((f) => {
    map.set(f.slug, { is_premium: f.is_premium, token_cost: f.token_cost });
  });
  return map;
}

/**
 * Inline badge — renderkan kalau slug ditandai premium di flagMap.
 */
export function PremiumBadgeInline({ flagMap, slug }: { flagMap: Map<string, { is_premium: boolean; token_cost: number }>; slug: string }) {
  const flag = flagMap.get(slug);
  if (!flag?.is_premium) return null;
  return (
    <span className="rounded-full bg-gradient-to-br from-purple-500 to-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
      💎 {flag.token_cost > 0 ? `${flag.token_cost}🪙` : ""}
    </span>
  );
}

// Re-export buat backward compat sama Batch 0
export { PremiumBadgeInline as PremiumBadge };
