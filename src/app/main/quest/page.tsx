import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestSeven } from "@/components/QuestSeven";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = { title: "7 Hari Kenal Diri — Flouwell" };

export default async function QuestPage() {
  const _blocked_ = await checkPremiumAccess("quest");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: prompts }, { data: entries }] = await Promise.all([
    supabase.from("quest_prompts").select("day, prompt").order("day"),
    supabase.from("quest_entries").select("day, body").eq("user_id", user.id),
  ]);

  const promptList: string[] = [];
  (prompts ?? []).forEach((r: { day: number; prompt: string }) => { promptList[r.day - 1] = r.prompt; });

  const initial: Record<number, string> = {};
  (entries ?? []).forEach((r: { day: number; body: string }) => { initial[r.day] = r.body; });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🗺️ 7 Hari Kenal Diri</h1>
      </header>
      {promptList.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">Belum ada prompt.</p>
      ) : (
        <QuestSeven initial={initial} prompts={promptList} />
      )}
    </main>
  );
}
