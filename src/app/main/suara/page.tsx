import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SuaraPlayer, type VoiceScenario } from "@/components/games/SuaraPlayer";

export const metadata = { title: "Suara Dalam Kepala — Soulpace" };

export default async function SuaraPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("voice_scenarios").select("id, situation, critic_text, supportive_text, outcome_critic, outcome_supportive").eq("is_active", true).order("sort_order");
  const scenarios = (data ?? []) as VoiceScenario[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🗣️ Suara Dalam Kepala</h1>
      </header>
      <p className="text-sm text-ink/60">Ada situasi, ada 2 suara. Lo pilih mana yang mau didengerin & lihat dampaknya.</p>
      <SuaraPlayer scenarios={scenarios} />
    </main>
  );
}
