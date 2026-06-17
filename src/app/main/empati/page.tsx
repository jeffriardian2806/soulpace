import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmpathyScenario } from "@/core/empathyScenarios";
import { EmpathyGame } from "@/components/EmpathyGame";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Pilih Respons Terbaik — Soulpace" };

export default async function EmpatiPage() {
  const _blocked_ = await checkPremiumAccess("empati");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("empathy_scenarios")
    .select("id, topic, situation, options")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const scenarios = (data ?? []) as EmpathyScenario[];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">💙 Pilih Respons Terbaik</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Latihan bales curhat orang dengan cara yang aman & nggak menghakimi.
      </p>
      {scenarios.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada skenario. Cek lagi nanti ya.</p>
      ) : (
        <EmpathyGame scenarios={scenarios} />
      )}
    </main>
  );
}
