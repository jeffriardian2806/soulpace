import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeatureFlagsTable } from "./FeatureFlagsTable";
import { VouchersPanel } from "./VouchersPanel";

export const metadata = { title: "Monetisasi — Admin Flouwell" };

export default async function AdminMonetizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [{ data: flagRows }, { data: voucherRows }] = await Promise.all([
    supabase.from("feature_flags").select("slug, name, description, is_premium, token_cost, timer_seconds, sort_order, is_active").order("sort_order"),
    supabase.from("vouchers").select("id, code, notes, token_amount, days_amount, max_redeem, redeem_count, expires_at, is_active, created_at").order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/settings" className="text-sm font-medium text-sky-600 hover:underline">
          ← Pengaturan
        </Link>
        <Link href="/admin/games" className="text-xs font-medium text-sky-600 hover:underline">
          🎮 Admin Games
        </Link>
      </header>
      <h1 className="text-xl font-bold text-ink">💎 Monetisasi</h1>
      <p className="text-sm leading-relaxed text-ink/60">
        Atur fitur mana yang premium (default semua FREE), berapa token cost-nya, dan terbitkan voucher buat user. Toggle bisa diubah kapan saja secara dinamis.
      </p>

      <FeatureFlagsTable items={(flagRows ?? []) as { slug: string; name: string; description: string | null; is_premium: boolean; token_cost: number; timer_seconds: number | null; sort_order: number; is_active: boolean }[]} />
      <VouchersPanel items={(voucherRows ?? []) as { id: string; code: string; notes: string | null; token_amount: number; days_amount: number; max_redeem: number; redeem_count: number; expires_at: string | null; is_active: boolean; created_at: string }[]} />
    </main>
  );
}
