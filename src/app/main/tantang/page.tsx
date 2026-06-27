import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TantangPlayer, type CbtScenario } from "@/components/games/TantangPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Tantang Pikiran — Flouwell" };

export default async function TantangPage() {
  const _blocked_ = await checkPremiumAccess("tantang");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("cbt_scenarios")
    .select("id, context, thoughts")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const scenarios = (data ?? []) as CbtScenario[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🌀 Tantang Pikiran</h1>
      </header>
      <p className="text-sm text-ink/60">
        Latihan singkat berbasis CBT. Liat skenario, baca pikiran yang muncul, kategorikan: distorsi, masih bisa iya/engga, atau pikiran sehat.
      </p>
      <TantangPlayer scenarios={scenarios} />
    </main>
  );
}
