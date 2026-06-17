import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GroundingPlayer, type GroundingStep } from "@/components/games/GroundingPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Grounding 5-4-3-2-1 — Soulpace" };

export default async function GroundingPage() {
  const _blocked_ = await checkPremiumAccess("grounding");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("grounding_steps")
    .select("count, sense, instr, emoji")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const steps = (data ?? []) as GroundingStep[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🧭 Grounding 5-4-3-2-1</h1>
      </header>
      <p className="text-sm text-ink/60">
        Latihan singkat buat saat cemas atau pikiran lagi rame. Kembali ke sekarang lewat indra.
      </p>
      <GroundingPlayer steps={steps} />
    </main>
  );
}
