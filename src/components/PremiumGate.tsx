import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server component yang gate fitur premium.
 * Cek feature_flags + status user; kalau diizinkan, render children + log akses.
 * Kalau diblokir, tampilin upgrade prompt.
 *
 * Usage:
 *   <PremiumGate slug="spektrum">
 *     <SpektrumPlayer ... />
 *   </PremiumGate>
 */
export async function PremiumGate({ slug, children }: { slug: string; children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch flag
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("is_premium, token_cost, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  // Kalau fitur ga registered atau ga premium → langsung allow
  if (!flag || !flag.is_premium) {
    return <>{children}</>;
  }

  // Guest user → block (kasih prompt login)
  if (!user) {
    return <PremiumBlocked slug={slug} name={flag.name} tokenCost={flag.token_cost} reason="login" />;
  }

  // Cek user status
  const { data: profile } = await supabase
    .from("profiles")
    .select("premium_until, token_balance")
    .eq("id", user.id)
    .single();

  const premiumActive = profile?.premium_until && new Date(profile.premium_until) > new Date();
  if (premiumActive) return <>{children}</>;

  if ((profile?.token_balance ?? 0) >= flag.token_cost) {
    // User punya cukup token — allow + show notice di header (consumption happens di server action saat user submit hasil)
    return <>{children}</>;
  }

  // Block
  return <PremiumBlocked slug={slug} name={flag.name} tokenCost={flag.token_cost} balance={profile?.token_balance ?? 0} reason="insufficient" />;
}

function PremiumBlocked({ slug, name, tokenCost, balance, reason }: { slug: string; name: string; tokenCost: number; balance?: number; reason: "login" | "insufficient" }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-purple-100 to-rose-100 p-6 ring-1 ring-purple-200">
      <p className="text-3xl">💎</p>
      <p className="mt-2 text-lg font-bold text-ink">{name} — Fitur Premium</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        {reason === "login"
          ? "Login dulu buat akses fitur ini."
          : `Fitur ini butuh ${tokenCost} token per akses, atau premium aktif. Saldo token kamu sekarang: ${balance}.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={reason === "login" ? `/login?next=/main/${slug}` : "/premium/redeem"} className="rounded-full bg-gradient-to-br from-sky-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white">
          {reason === "login" ? "Login" : "💎 Redeem voucher"}
        </Link>
        <Link href="/feed" className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-200">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

/**
 * Small badge buat dipake di list/grid card buat indicate fitur premium.
 */
export async function PremiumBadge({ slug }: { slug: string }) {
  const supabase = await createClient();
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("is_premium, token_cost")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!flag?.is_premium) return null;
  return (
    <span className="rounded-full bg-gradient-to-br from-purple-500 to-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
      💎 {flag.token_cost > 0 ? `${flag.token_cost} 🪙` : "Premium"}
    </span>
  );
}
