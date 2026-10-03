import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPremiumStatus } from "@/lib/monetization/access";
import { RedeemForm } from "./RedeemForm";

export const metadata = { title: "Redeem Voucher — Soulpace" };

export default async function RedeemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium/redeem");

  const status = await getUserPremiumStatus();
  const premiumActive = status?.premium_until && new Date(status.premium_until) > new Date();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">💎 Redeem Voucher</h1>
      </header>

      <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 p-5 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Status kamu</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <p className="text-xs text-white/80">🪙 Token: <span className="font-bold">{status?.token_balance ?? 0}</span></p>
          <p className="text-xs text-white/80">
            ⏳ Premium: {premiumActive ? <span className="font-bold">aktif sampai {new Date(status!.premium_until!).toLocaleDateString("id-ID")}</span> : "ga aktif"}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-ink/65">
        Punya kode voucher? Masukin di sini buat dapet token atau perpanjang premium.
      </p>

      <RedeemForm />

      <div className="rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-ink/65">
        <p className="font-semibold text-ink">Gimana cara dapet voucher?</p>
        <p className="mt-1">Voucher dikeluarin Soulpace lewat promo / partner / referral. Kalau kamu dapet kode dari teman atau partner kami, tinggal masukin di atas.</p>
      </div>
    </main>
  );
}
