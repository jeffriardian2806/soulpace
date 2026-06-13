import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MirrorPlayer, type MirrorScenario, type MirrorProfile } from "@/components/games/MirrorPlayer";

export const metadata = { title: "Pikiran Mirror — Soulpace" };

export default async function CerminPage() {
  const supabase = await createClient();
  const [{ data: sRows }, { data: pRows }] = await Promise.all([
    supabase.from("mirror_scenarios").select("id, category, situation, options").eq("is_active", true).order("sort_order"),
    supabase.from("mirror_profiles").select("slug, name, emoji, description, insight").eq("is_active", true).order("sort_order"),
  ]);
  const scenarios = (sRows ?? []) as MirrorScenario[];
  const profiles = (pRows ?? []) as MirrorProfile[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🪞 Pikiran Mirror</h1>
      </header>
      <p className="text-sm text-ink/60">{scenarios.length} situasi hidup, pilih respons yang paling kamu banget. Di akhir, dapet profil cara kamu menghadapi hal.</p>
      <MirrorPlayer scenarios={scenarios} profiles={profiles} />
    </main>
  );
}
