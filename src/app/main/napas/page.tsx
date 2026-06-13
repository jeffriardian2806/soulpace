import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NapasPlayer, type BreathProtocol } from "@/components/games/NapasPlayer";

export const metadata = { title: "Tarik Napas — Soulpace" };

export default async function NapasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("breathing_protocols")
    .select("slug, label, in_seconds, hold_seconds, out_seconds")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const protocols = (data ?? []) as BreathProtocol[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">🫧 Tarik Napas</h1>
      </header>
      <p className="text-sm text-ink/60">
        Latihan napas pelan. Bantu badan tenang waktu cemas atau kewalahan.
      </p>
      <NapasPlayer protocols={protocols} />
    </main>
  );
}
