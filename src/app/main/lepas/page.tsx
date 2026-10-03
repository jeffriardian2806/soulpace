import Link from "next/link";
import { LepasPlayer } from "@/components/games/LepasPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Lepasin Pikiran — Soulpace" };

export default async function LepasPage() {
  const _blocked_ = await checkPremiumAccess("lepas");
  if (_blocked_) return _blocked_;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">💨 Lepasin Pikiran</h1>
      </header>
      <p className="text-sm text-ink/60">
        Tulis pikiran yang lagi ganggu, satu per satu. Tap balonnya buat pecahin — anggap aja kamu lepasin pikiran itu pelan-pelan.
      </p>
      <LepasPlayer />
    </main>
  );
}
