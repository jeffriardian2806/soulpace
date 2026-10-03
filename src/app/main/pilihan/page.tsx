import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThisOrThat } from "@/components/ThisOrThat";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "Ini atau Itu — Soulpace" };

export default async function PilihanPage() {
  const _blocked_ = await checkPremiumAccess("pilihan");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("this_or_that")
    .select("prompt_a, prompt_b")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const prompts = (data ?? []).map((r: { prompt_a: string; prompt_b: string }) => ({ a: r.prompt_a, b: r.prompt_b }));

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🌙 Ini atau Itu</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">Check-in 1 menit. Pilih yang lebih kamu rasain.</p>
      {prompts.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada prompt aktif.</p>
      ) : (
        <ThisOrThat prompts={prompts} />
      )}
    </main>
  );
}
