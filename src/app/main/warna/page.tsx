import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WarnaPlayer, type MoodColor } from "@/components/games/WarnaPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Warna Hari Ini — Flouwell" };

export default async function WarnaPage() {
  const _blocked_ = await checkPremiumAccess("warna");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("mood_colors")
    .select("hex, label, note")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const palette = (data ?? []) as MoodColor[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🎨 Warna Hari Ini</h1>
      </header>
      <p className="text-sm text-ink/60">
        Kadang perasaan itu susah dijelasin pake kata. Pilih warna yang match sama vibe kamu hari ini.
      </p>
      <WarnaPlayer palette={palette} />
    </main>
  );
}
