import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BateraiPlayer, type BatteryAction } from "@/components/games/BateraiPlayer";

export const metadata = { title: "Energi Sosial — Soulpace" };

export default async function BateraiPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("battery_actions").select("id, emoji, label, description, social_delta, energy_delta, productivity_delta").eq("is_active", true).order("sort_order");
  const actions = (data ?? []) as BatteryAction[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🔋 Energi Sosial</h1>
      </header>
      <p className="text-sm text-ink/60">Simulasi 7 hari kehidupan. Pilih aktivitas tiap hari, jaga balance energi sosial, fisik, dan produktivitas.</p>
      <BateraiPlayer actions={actions} />
    </main>
  );
}
