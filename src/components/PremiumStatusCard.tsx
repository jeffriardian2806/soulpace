import Link from "next/link";
import { getUserPremiumStatus } from "@/lib/monetization/access";

export async function PremiumStatusCard() {
  const status = await getUserPremiumStatus();
  if (!status) return null;
  const premiumActive = status.premium_until && new Date(status.premium_until) > new Date();
  return (
    <div className={`rounded-2xl p-4 ${premiumActive ? "bg-gradient-to-br from-sky-400 to-purple-500 text-white" : "glass"}`}>
      <div className="flex items-baseline justify-between">
        <p className={`text-xs uppercase tracking-wide ${premiumActive ? "text-white/70" : "text-ink/55"}`}>💎 Status Premium</p>
        <Link href="/premium/redeem" className={`text-xs font-medium ${premiumActive ? "text-white" : "text-sky-600"}`}>
          Redeem voucher →
        </Link>
      </div>
      <div className={`mt-2 flex flex-wrap items-baseline gap-3 text-xs ${premiumActive ? "text-white/85" : "text-ink/75"}`}>
        <p>🪙 Token: <strong>{status.token_balance}</strong></p>
        <p>
          ⏳ Premium: {premiumActive ? <strong>aktif sampai {new Date(status.premium_until!).toLocaleDateString("id-ID")}</strong> : "tidak aktif"}
        </p>
      </div>
    </div>
  );
}
