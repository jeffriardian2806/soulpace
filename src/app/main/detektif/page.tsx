import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DetektifPlayer, type DetectiveCase } from "@/components/games/DetektifPlayer";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Detektif Emosi — Soulpace" };

export default async function DetektifPage() {
  const _blocked_ = await checkPremiumAccess("detektif");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase.from("detective_cases").select("id, content, correct, options").eq("is_active", true).order("sort_order");
  const cases = (data ?? []) as DetectiveCase[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🔍 Detektif Emosi</h1>
      </header>
      <p className="text-sm text-ink/60">Baca chat / situasi, tebak emosi di baliknya. Latihan EQ ringan.</p>
      <DetektifPlayer cases={cases} />
    </main>
  );
}
