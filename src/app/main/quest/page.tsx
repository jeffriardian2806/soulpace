import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestSeven } from "@/components/QuestSeven";

export const metadata = { title: "7 Hari Kenal Diri — Soulpace" };

export default async function QuestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("quest_entries")
    .select("day, body")
    .eq("user_id", user.id);
  const initial: Record<number, string> = {};
  (data ?? []).forEach((r: { day: number; body: string }) => { initial[r.day] = r.body; });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🗺️ 7 Hari Kenal Diri</h1>
      </header>
      <QuestSeven initial={initial} />
    </main>
  );
}
