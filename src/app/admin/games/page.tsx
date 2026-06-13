import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import type { Quiz } from "@/core/quizzes";
import type { EmpathyScenario } from "@/core/empathyScenarios";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { ScenarioEditor } from "@/components/admin/ScenarioEditor";
import { TotEditor, DcEditor, QuestPromptsEditor, VibeEditor, BreathingEditor, MoodColorEditor, GroundingEditor, CbtScenarioEditor, DailyMessageEditor, MirrorProfileEditor, MirrorScenarioEditor, DetectiveEditor, VoiceEditor, BatteryEditor, EmotionEditor, TarotEditor, MonsterEditor } from "@/components/admin/MiscEditors";

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
  const [{ data: totRows }, { data: dcRows }, { data: qpRows }, { data: vpRows }, { data: brRows }, { data: mcRows }, { data: grRows }, { data: cbtRows }, { data: dmRows }, { data: mpRows }, { data: msRows }, { data: dcCaseRows }, { data: vsRows }, { data: baRows }, { data: ecRows }, { data: tcRows }, { data: monsRows }] = await Promise.all([
    supabase.from("this_or_that").select("id, prompt_a, prompt_b").order("sort_order"),
    supabase.from("daily_challenges").select("id, body").order("sort_order"),
    supabase.from("quest_prompts").select("day, prompt").order("day"),
    supabase.from("vibe_presets").select("id, emoji, label, href").order("sort_order"),
    supabase.from("breathing_protocols").select("id, slug, label, in_seconds, hold_seconds, out_seconds, sort_order, is_active").order("sort_order"),
    supabase.from("mood_colors").select("id, hex, label, note, sort_order, is_active").order("sort_order"),
    supabase.from("grounding_steps").select("id, count, sense, instr, emoji, sort_order, is_active").order("sort_order"),
    supabase.from("cbt_scenarios").select("id, context, thoughts, sort_order, is_active").order("sort_order"),
    supabase.from("daily_messages").select("id, body, sort_order, is_active").order("sort_order"),
    supabase.from("mirror_profiles").select("id, slug, name, emoji, description, insight, sort_order, is_active").order("sort_order"),
    supabase.from("mirror_scenarios").select("id, category, situation, options, sort_order, is_active").order("sort_order"),
    supabase.from("detective_cases").select("id, content, correct, options, sort_order, is_active").order("sort_order"),
    supabase.from("voice_scenarios").select("id, situation, critic_text, supportive_text, outcome_critic, outcome_supportive, sort_order, is_active").order("sort_order"),
    supabase.from("battery_actions").select("id, emoji, label, description, social_delta, energy_delta, productivity_delta, sort_order, is_active").order("sort_order"),
    supabase.from("emotion_cards").select("id, content, correct, options, sort_order, is_active").order("sort_order"),
    supabase.from("tarot_cards").select("id, name, emoji, meaning_situation, meaning_feeling, meaning_action, sort_order, is_active").order("sort_order"),
    supabase.from("monster_situations").select("id, situation, responses, sort_order, is_active").order("sort_order"),
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
      <BreathingEditor items={(brRows ?? []) as { id: string; slug: string; label: string; in_seconds: number; hold_seconds: number; out_seconds: number; sort_order: number; is_active: boolean }[]} />
      <MoodColorEditor items={(mcRows ?? []) as { id: string; hex: string; label: string; note: string; sort_order: number; is_active: boolean }[]} />
      <GroundingEditor items={(grRows ?? []) as { id: string; count: number; sense: string; instr: string; emoji: string; sort_order: number; is_active: boolean }[]} />
      <DailyMessageEditor items={(dmRows ?? []) as { id: string; body: string; sort_order: number; is_active: boolean }[]} />
      <MirrorProfileEditor items={(mpRows ?? []) as { id: string; slug: string; name: string; emoji: string; description: string; insight: string; sort_order: number; is_active: boolean }[]} />
      <MirrorScenarioEditor items={(msRows ?? []) as { id: string; category: string; situation: string; options: { text: string; profile_slug: string }[]; sort_order: number; is_active: boolean }[]} profiles={(mpRows ?? []).map((p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name }))} />
      <DetectiveEditor items={(dcCaseRows ?? []) as { id: string; content: string; correct: string; options: { slug: string; label: string; explanation: string }[]; sort_order: number; is_active: boolean }[]} />
      <VoiceEditor items={(vsRows ?? []) as { id: string; situation: string; critic_text: string; supportive_text: string; outcome_critic: string; outcome_supportive: string; sort_order: number; is_active: boolean }[]} />
      <BatteryEditor items={(baRows ?? []) as { id: string; emoji: string; label: string; description: string; social_delta: number; energy_delta: number; productivity_delta: number; sort_order: number; is_active: boolean }[]} />
      <EmotionEditor items={(ecRows ?? []) as { id: string; content: string; correct: string; options: string[]; sort_order: number; is_active: boolean }[]} />
      <TarotEditor items={(tcRows ?? []) as { id: string; name: string; emoji: string; meaning_situation: string; meaning_feeling: string; meaning_action: string; sort_order: number; is_active: boolean }[]} />
      <MonsterEditor items={(monsRows ?? []) as { id: string; situation: string; responses: { text: string; effect: "grow" | "shrink" | "stay"; insight: string }[]; sort_order: number; is_active: boolean }[]} />
      <CbtScenarioEditor items={(cbtRows ?? []) as { id: string; context: string; thoughts: { text: string; correct: "distorsi" | "netral" | "sehat"; insight: string; distortion_type?: string | null }[]; sort_order: number; is_active: boolean }[]} />
    </main>
  );
}
