import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuraPlayer, type AuraMood } from "@/components/games/AuraPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Cek Aura AR — Flouwell" };

export default async function AuraPage() {
  const _blocked_ = await checkPremiumAccess("aura");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("aura_moods")
    .select("mood_key, emoji, label, color, glow, particle, desc_short, desc_mystic")
    .eq("is_active", true)
    .order("sort_order");
  const moods = (data ?? []) as AuraMood[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🔮 Cek Aura AR</h1>
      </header>
      <p className="text-sm text-ink/60">
        Arahin kamera ke wajah kamu, AR bakal baca ekspresi dan nampilin warna aura kamu real-time. Seru-seruan aja!
      </p>
      <AuraPlayer moods={moods} />
    </main>
  );
}
