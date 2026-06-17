import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmosiPlayer, type EmotionCard } from "@/components/games/EmosiPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Tebak Emosi — Soulpace" };

export default async function EmosiPage() {
  const _blocked_ = await checkPremiumAccess("emosi");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase.from("emotion_cards").select("id, content, correct, options").eq("is_active", true).order("sort_order");
  const cards = (data ?? []) as EmotionCard[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🎯 Tebak Emosi</h1>
      </header>
      <p className="text-sm text-ink/60">Rapid-fire: lihat kartu, tebak emosi sebenarnya. Cepet & seru.</p>
      <EmosiPlayer cards={cards} />
    </main>
  );
}
