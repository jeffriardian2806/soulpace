import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TarotPlayer, type TarotCard } from "@/components/games/TarotPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Tarot Refleksi — Soulpace" };

export default async function TarotPage() {
  const _blocked_ = await checkPremiumAccess("tarot");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase.from("tarot_cards").select("id, name, emoji, meaning_situation, meaning_feeling, meaning_action").eq("is_active", true).order("sort_order");
  const cards = (data ?? []) as TarotCard[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🎴 Tarot Refleksi</h1>
      </header>
      <p className="text-sm text-ink/60">Tarik 3 kartu, dapet prompt refleksi tentang situasi, perasaan, dan aksi. Bukan ramalan — alat cermin diri.</p>
      <TarotPlayer cards={cards} />
    </main>
  );
}
