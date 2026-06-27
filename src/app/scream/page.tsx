import Link from "next/link";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { ScreamRelease } from "@/components/scream/ScreamRelease";

export const metadata = {
  title: "Lampias Suara — Flouwell",
  description: "Real-time audio release tool. Audio diproses di browser, NOL recording.",
};

export default async function ScreamPage() {
  const _blocked_ = await checkPremiumAccess("scream");
  if (_blocked_) return _blocked_;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">📢 Lampias Suara</h1>
      </header>
      <ScreamRelease />
    </main>
  );
}
