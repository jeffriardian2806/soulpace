import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import type { Quiz } from "@/core/quizzes";
import type { EmpathyScenario } from "@/core/empathyScenarios";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { ScenarioEditor } from "@/components/admin/ScenarioEditor";
import { TotEditor, DcEditor, QuestPromptsEditor, VibeEditor } from "@/components/admin/MiscEditors";

export const metadata = { title: "Admin · Game & Kuis — Soulpace" };

export default async function AdminGamesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const svc = await getProfilesService();
  const profile = await svc.getProfile(user.id);
  if (profile?.role !== "moderator") redirect("/feed");

  const { data: quizRows } = await supabase
    .from("quizzes")
    .select("slug, title, emoji, intro, questions, results, is_active")
    .order("sort_order", { ascending: true });
  const { data: scenRows } = await supabase
    .from("empathy_scenarios")
    .select("id, topic, situation, options, is_active")
    .order("sort_order", { ascending: true });
  const [{ data: totRows }, { data: dcRows }, { data: qpRows }, { data: vpRows }] = await Promise.all([
    supabase.from("this_or_that").select("id, prompt_a, prompt_b").order("sort_order"),
    supabase.from("daily_challenges").select("id, body").order("sort_order"),
    supabase.from("quest_prompts").select("day, prompt").order("day"),
    supabase.from("vibe_presets").select("id, emoji, label, href").order("sort_order"),
  ]);

  const quizzes = (quizRows ?? []).map((q) => ({
    key: q.slug, title: q.title, emoji: q.emoji, intro: q.intro,
    questions: q.questions, results: q.results, is_active: q.is_active,
  })) as (Quiz & { is_active: boolean })[];
  const scenarios = (scenRows ?? []) as (EmpathyScenario & { is_active: boolean })[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Admin · Game & Kuis</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">Beranda</Link>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Kuis reflektif</h2>
        <p className="text-xs text-ink/55">Edit pertanyaan, opsi (label + tipe), dan hasil. Tipe opsi harus cocok sama type hasil.</p>
        {quizzes.map((q) => <QuizEditor key={q.key} quiz={q} />)}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-ink">Skenario empati (Pilih Respons Terbaik)</h2>
        <p className="text-xs text-ink/55">Tandai minimal 1 opsi sebagai “aman”. Buat skenario krisis, arahin ke pendampingan.</p>
        <ScenarioEditor scenarios={scenarios} />
      </section>

      <TotEditor items={(totRows ?? []) as { id: string; prompt_a: string; prompt_b: string }[]} />
      <DcEditor items={(dcRows ?? []) as { id: string; body: string }[]} />
      <QuestPromptsEditor items={(qpRows ?? []) as { day: number; prompt: string }[]} />
      <VibeEditor items={(vpRows ?? []) as { id: string; emoji: string; label: string; href: string }[]} />
    </main>
  );
}
