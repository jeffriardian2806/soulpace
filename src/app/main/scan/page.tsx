import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScanDiriPlayer, type AuraMood, type ScanContent } from "@/components/games/ScanDiriPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Scan Diri AR — Flouwell" };

export default async function ScanDiriPage() {
  const _blocked_ = await checkPremiumAccess("scan-diri");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const [moodsRes, contentsRes] = await Promise.all([
    supabase.from("aura_moods").select("mood_key, emoji, label, color, glow, particle, desc_short, desc_mystic").eq("is_active", true).order("sort_order"),
    supabase.from("scan_contents").select("mode, content_key, emoji, title, body, extra, sort_order").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🔮 Scan Diri AR</h1>
      </header>
      <p className="text-sm text-ink/60">
        Satu kamera, banyak mode: aura, persona, karakter, love meter, umur emosi, pesan masa depan, sampai pembacaan batin. Pilih icon mode, scan, dan lihat hasilmu.
      </p>
      <ScanDiriPlayer
        moods={(moodsRes.data ?? []) as AuraMood[]}
        contents={(contentsRes.data ?? []) as ScanContent[]}
      />
    </main>
  );
}
