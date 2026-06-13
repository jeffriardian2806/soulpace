import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MonsterPlayer, type MonsterSituation } from "@/components/games/MonsterPlayer";

export const metadata = { title: "Monster Cemas — Soulpace" };

export default async function MonsterPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("monster_situations").select("id, situation, responses").eq("is_active", true).order("sort_order");
  const situations = (data ?? []) as MonsterSituation[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">👹 Monster Cemas</h1>
      </header>
      <p className="text-sm text-ink/60">Monster cemas ngomong pikiran negatif. Pilih respons kamu — liat dia mengecil atau membesar.</p>
      <MonsterPlayer situations={situations} />
    </main>
  );
}
