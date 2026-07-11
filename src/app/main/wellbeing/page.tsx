import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WellbeingPlayer, type Content } from "@/components/games/WellbeingPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Wellbeing AR — Flouwell" };

export default async function WellbeingPage() {
  const _blocked_ = await checkPremiumAccess("wellbeing");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase.from("wellbeing_contents")
    .select("id, kind, content_key, emoji, title, body, extra, sort_order")
    .eq("is_active", true).order("kind").order("sort_order");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🌿 Wellbeing AR</h1>
      </header>
      <p className="text-sm text-ink/60">
        4 latihan kecil dalam 1 tempat: napas, latihan fokus, positive hunt, dan kupu tenang. Pilih tab, mulai kapan aja.
      </p>
      <WellbeingPlayer contents={(data ?? []) as Content[]} />
    </main>
  );
}
