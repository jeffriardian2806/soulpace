import Link from "next/link";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { TrailGame } from "@/components/trail/TrailGame";

export const metadata = {
  title: "Trail Making Test — Flouwell",
  description: "Game penalaran: hubungin titik berurutan secepet & seakurat mungkin. Ngukur cognitive flexibility & atensi.",
};

export default async function TrailPage() {
  const _blocked_ = await checkPremiumAccess("trail");
  if (_blocked_) return _blocked_;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🛤️ Trail Making Test</h1>
      </header>
      <TrailGame />
    </main>
  );
}
