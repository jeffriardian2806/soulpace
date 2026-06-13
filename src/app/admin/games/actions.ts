"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type QuizPayload = {
  slug: string;
  title: string;
  emoji: string;
  intro: string;
  questions: unknown;
  results: unknown;
  is_active: boolean;
};

export async function saveQuizAction(payload: QuizPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!payload.slug.trim() || !payload.title.trim()) return { error: "Slug & judul wajib." };
  const { error } = await supabase.from("quizzes").upsert(
    {
      slug: payload.slug.trim(),
      title: payload.title.trim(),
      emoji: payload.emoji,
      intro: payload.intro,
      questions: payload.questions,
      results: payload.results,
      is_active: payload.is_active,
    },
    { onConflict: "slug" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/main");
  revalidatePath(`/main/${payload.slug.trim()}`);
  return { error: null };
}

export async function deleteQuizAction(slug: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("slug", slug);
  if (error) return { error: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/main");
  return { error: null };
}

type ScenarioPayload = {
  id?: string;
  topic: string;
  situation: string;
  options: { text: string; safe: boolean; feedback: string }[];
  is_active: boolean;
  sort_order: number;
};

export async function saveScenarioAction(p: ScenarioPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.situation.trim() || p.options.length < 2) return { error: "Situasi + min 2 opsi." };
  if (!p.options.some((o) => o.safe)) return { error: "Minimal 1 opsi ditandai aman." };
  const row = {
    topic: p.topic.trim() || "Umum",
    situation: p.situation.trim(),
    options: p.options,
    is_active: p.is_active,
    sort_order: p.sort_order,
  };
  const { error } = p.id
    ? await supabase.from("empathy_scenarios").update(row).eq("id", p.id)
    : await supabase.from("empathy_scenarios").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/main/empati");
  return { error: null };
}

export async function deleteScenarioAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("empathy_scenarios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/main/empati");
  return { error: null };
}

// ---- This or That ----
export async function saveTotAction(id: string | null, prompt_a: string, prompt_b: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!prompt_a.trim() || !prompt_b.trim()) return { error: "Dua sisi wajib diisi." };
  const row = { prompt_a: prompt_a.trim(), prompt_b: prompt_b.trim(), is_active: true };
  const { error } = id
    ? await supabase.from("this_or_that").update(row).eq("id", id)
    : await supabase.from("this_or_that").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/pilihan");
  return { error: null };
}
export async function deleteTotAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("this_or_that").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/pilihan");
  return { error: null };
}

// ---- Daily Challenges ----
export async function saveDcAction(id: string | null, body: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!body.trim()) return { error: "Isi wajib." };
  const row = { body: body.trim(), is_active: true };
  const { error } = id
    ? await supabase.from("daily_challenges").update(row).eq("id", id)
    : await supabase.from("daily_challenges").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main");
  return { error: null };
}
export async function deleteDcAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_challenges").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main");
  return { error: null };
}

// ---- Quest Prompts (7 hari, day = PK) ----
export async function saveQuestPromptAction(day: number, prompt: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!prompt.trim() || day < 1 || day > 7) return { error: "Day 1-7 + prompt wajib." };
  const { error } = await supabase.from("quest_prompts").upsert({ day, prompt: prompt.trim() }, { onConflict: "day" });
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/quest");
  return { error: null };
}

// ---- Vibe Presets ----
export async function saveVibeAction(id: string | null, emoji: string, label: string, href: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!label.trim() || !href.trim()) return { error: "Label & href wajib." };
  const row = { emoji, label: label.trim(), href: href.trim(), is_active: true };
  if (id) {
    const { error } = await supabase.from("vibe_presets").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const slug = "vibe_" + Date.now().toString(36);
    const { error } = await supabase.from("vibe_presets").insert({ ...row, slug });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/games"); revalidatePath("/main");
  return { error: null };
}
export async function deleteVibeAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_presets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main");
  return { error: null };
}

// ==================== NEW: 4 interactive games content ====================

type BreathingPayload = {
  id?: string;
  slug: string;
  label: string;
  in_seconds: number;
  hold_seconds: number;
  out_seconds: number;
  sort_order: number;
  is_active: boolean;
};

export async function saveBreathingAction(p: BreathingPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.slug.trim() || !p.label.trim()) return { error: "Slug & label wajib." };
  const row = {
    slug: p.slug.trim(),
    label: p.label.trim(),
    in_seconds: p.in_seconds,
    hold_seconds: p.hold_seconds,
    out_seconds: p.out_seconds,
    sort_order: p.sort_order,
    is_active: p.is_active,
  };
  const q = p.id
    ? supabase.from("breathing_protocols").update(row).eq("id", p.id)
    : supabase.from("breathing_protocols").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/main/napas");
  return { error: null };
}
export async function deleteBreathingAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("breathing_protocols").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/napas");
  return { error: null };
}

type MoodColorPayload = {
  id?: string;
  hex: string;
  label: string;
  note: string;
  sort_order: number;
  is_active: boolean;
};
export async function saveMoodColorAction(p: MoodColorPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.hex.trim() || !p.label.trim()) return { error: "Hex & label wajib." };
  const row = { hex: p.hex.trim(), label: p.label.trim(), note: p.note, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id
    ? supabase.from("mood_colors").update(row).eq("id", p.id)
    : supabase.from("mood_colors").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/warna");
  return { error: null };
}
export async function deleteMoodColorAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("mood_colors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/warna");
  return { error: null };
}

type GroundingStepPayload = {
  id?: string;
  count: number;
  sense: string;
  instr: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
};
export async function saveGroundingAction(p: GroundingStepPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.sense.trim() || !p.instr.trim()) return { error: "Sense & instruksi wajib." };
  const row = { count: p.count, sense: p.sense.trim(), instr: p.instr, emoji: p.emoji, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id
    ? supabase.from("grounding_steps").update(row).eq("id", p.id)
    : supabase.from("grounding_steps").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/grounding");
  return { error: null };
}
export async function deleteGroundingAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("grounding_steps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/grounding");
  return { error: null };
}

type CbtThoughtPayload = {
  text: string;
  correct: "distorsi" | "netral" | "sehat";
  insight: string;
  distortion_type?: string | null;
};
type CbtScenarioPayload = {
  id?: string;
  context: string;
  thoughts: CbtThoughtPayload[];
  sort_order: number;
  is_active: boolean;
};
export async function saveCbtScenarioAction(p: CbtScenarioPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.context.trim()) return { error: "Skenario wajib." };
  if (!Array.isArray(p.thoughts) || p.thoughts.length === 0) return { error: "Minimal 1 pikiran." };
  const row = {
    context: p.context.trim(),
    thoughts: p.thoughts,
    sort_order: p.sort_order,
    is_active: p.is_active,
  };
  const q = p.id
    ? supabase.from("cbt_scenarios").update(row).eq("id", p.id)
    : supabase.from("cbt_scenarios").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/tantang");
  return { error: null };
}
export async function deleteCbtScenarioAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cbt_scenarios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/tantang");
  return { error: null };
}

type DailyMessagePayload = { id?: string; body: string; sort_order: number; is_active: boolean };
export async function saveDailyMessageAction(p: DailyMessagePayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.body.trim()) return { error: "Pesan wajib." };
  const row = { body: p.body.trim(), sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id
    ? supabase.from("daily_messages").update(row).eq("id", p.id)
    : supabase.from("daily_messages").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/feed");
  return { error: null };
}
export async function deleteDailyMessageAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_messages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/feed");
  return { error: null };
}

// ==================== Round-2 interactive games (Mirror, Detektif, Suara, Baterai, Emosi, Tarot, Monster) ====================

// --- Mirror profiles ---
type MirrorProfilePayload = { id?: string; slug: string; name: string; emoji: string; description: string; insight: string; sort_order: number; is_active: boolean };
export async function saveMirrorProfileAction(p: MirrorProfilePayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.slug.trim() || !p.name.trim()) return { error: "Slug & nama wajib." };
  const row = { slug: p.slug.trim(), name: p.name.trim(), emoji: p.emoji, description: p.description, insight: p.insight, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("mirror_profiles").update(row).eq("id", p.id) : supabase.from("mirror_profiles").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/cermin");
  return { error: null };
}
export async function deleteMirrorProfileAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mirror_profiles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/cermin");
  return { error: null };
}

// --- Mirror scenarios ---
type MirrorScenarioPayload = { id?: string; category: string; situation: string; options: { text: string; profile_slug: string }[]; sort_order: number; is_active: boolean };
export async function saveMirrorScenarioAction(p: MirrorScenarioPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.situation.trim()) return { error: "Situasi wajib." };
  if (p.options.length < 2) return { error: "Minimal 2 opsi." };
  const row = { category: p.category || "umum", situation: p.situation.trim(), options: p.options, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("mirror_scenarios").update(row).eq("id", p.id) : supabase.from("mirror_scenarios").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/cermin");
  return { error: null };
}
export async function deleteMirrorScenarioAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mirror_scenarios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/cermin");
  return { error: null };
}

// --- Detective cases ---
type DetectivePayload = { id?: string; content: string; correct: string; options: { slug: string; label: string; explanation: string }[]; sort_order: number; is_active: boolean };
export async function saveDetectiveAction(p: DetectivePayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.content.trim() || !p.correct.trim()) return { error: "Konten & jawaban benar wajib." };
  if (p.options.length < 2) return { error: "Minimal 2 opsi." };
  const row = { content: p.content.trim(), correct: p.correct.trim(), options: p.options, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("detective_cases").update(row).eq("id", p.id) : supabase.from("detective_cases").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/detektif");
  return { error: null };
}
export async function deleteDetectiveAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("detective_cases").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/detektif");
  return { error: null };
}

// --- Voice scenarios ---
type VoicePayload = { id?: string; situation: string; critic_text: string; supportive_text: string; outcome_critic: string; outcome_supportive: string; sort_order: number; is_active: boolean };
export async function saveVoiceAction(p: VoicePayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.situation.trim() || !p.critic_text.trim() || !p.supportive_text.trim()) return { error: "Situasi & kedua suara wajib." };
  const row = { situation: p.situation.trim(), critic_text: p.critic_text.trim(), supportive_text: p.supportive_text.trim(), outcome_critic: p.outcome_critic, outcome_supportive: p.outcome_supportive, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("voice_scenarios").update(row).eq("id", p.id) : supabase.from("voice_scenarios").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/suara");
  return { error: null };
}
export async function deleteVoiceAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("voice_scenarios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/suara");
  return { error: null };
}

// --- Battery actions ---
type BatteryPayload = { id?: string; emoji: string; label: string; description: string; social_delta: number; energy_delta: number; productivity_delta: number; sort_order: number; is_active: boolean };
export async function saveBatteryAction(p: BatteryPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.label.trim()) return { error: "Label wajib." };
  const row = { emoji: p.emoji, label: p.label.trim(), description: p.description, social_delta: p.social_delta, energy_delta: p.energy_delta, productivity_delta: p.productivity_delta, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("battery_actions").update(row).eq("id", p.id) : supabase.from("battery_actions").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/baterai");
  return { error: null };
}
export async function deleteBatteryAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("battery_actions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/baterai");
  return { error: null };
}

// --- Emotion cards ---
type EmotionPayload = { id?: string; content: string; correct: string; options: string[]; sort_order: number; is_active: boolean };
export async function saveEmotionAction(p: EmotionPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.content.trim() || !p.correct.trim()) return { error: "Konten & jawaban wajib." };
  if (p.options.length < 2) return { error: "Minimal 2 opsi." };
  const row = { content: p.content.trim(), correct: p.correct.trim(), options: p.options, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("emotion_cards").update(row).eq("id", p.id) : supabase.from("emotion_cards").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/emosi");
  return { error: null };
}
export async function deleteEmotionAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("emotion_cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/emosi");
  return { error: null };
}

// --- Tarot cards ---
type TarotPayload = { id?: string; name: string; emoji: string; meaning_situation: string; meaning_feeling: string; meaning_action: string; sort_order: number; is_active: boolean };
export async function saveTarotAction(p: TarotPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.name.trim()) return { error: "Nama kartu wajib." };
  const row = { name: p.name.trim(), emoji: p.emoji, meaning_situation: p.meaning_situation, meaning_feeling: p.meaning_feeling, meaning_action: p.meaning_action, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("tarot_cards").update(row).eq("id", p.id) : supabase.from("tarot_cards").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/tarot");
  return { error: null };
}
export async function deleteTarotAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tarot_cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/tarot");
  return { error: null };
}

// --- Monster situations ---
type MonsterPayload = { id?: string; situation: string; responses: { text: string; effect: "grow"|"shrink"|"stay"; insight: string }[]; sort_order: number; is_active: boolean };
export async function saveMonsterAction(p: MonsterPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.situation.trim()) return { error: "Pikiran monster wajib." };
  if (p.responses.length < 2) return { error: "Minimal 2 respons." };
  const row = { situation: p.situation.trim(), responses: p.responses, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("monster_situations").update(row).eq("id", p.id) : supabase.from("monster_situations").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/monster");
  return { error: null };
}
export async function deleteMonsterAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("monster_situations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/monster");
  return { error: null };
}

// ==================== Spektrum Sosial (introvert/extrovert) ====================

type PersonalityCategoryPayload = { id?: string; slug: string; name: string; emoji: string; description: string; sort_order: number; is_active: boolean };
export async function savePersonalityCategoryAction(p: PersonalityCategoryPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.slug.trim() || !p.name.trim()) return { error: "Slug & nama wajib." };
  const row = { slug: p.slug.trim(), name: p.name.trim(), emoji: p.emoji, description: p.description, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("personality_categories").update(row).eq("id", p.id) : supabase.from("personality_categories").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/spektrum");
  return { error: null };
}
export async function deletePersonalityCategoryAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("personality_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/spektrum");
  return { error: null };
}

type PersonalityQuestionPayload = { id?: string; category_id: string; text: string; options: { text: string; intro_weight: number; extro_weight: number }[]; sort_order: number; is_active: boolean };
export async function savePersonalityQuestionAction(p: PersonalityQuestionPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.text.trim() || !p.category_id) return { error: "Pertanyaan & kategori wajib." };
  if (p.options.length < 2) return { error: "Minimal 2 opsi." };
  const row = { category_id: p.category_id, text: p.text.trim(), options: p.options, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("personality_questions").update(row).eq("id", p.id) : supabase.from("personality_questions").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/spektrum");
  return { error: null };
}
export async function deletePersonalityQuestionAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("personality_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/spektrum");
  return { error: null };
}

// ==================== Kompas Jurusan (RIASEC) ====================

type CompassTypePayload = { letter: "R"|"I"|"A"|"S"|"E"|"C"; name: string; tagline: string; description: string; traits: string; sort_order: number; is_active: boolean };
export async function saveCompassTypeAction(p: CompassTypePayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.name.trim()) return { error: "Nama tipe wajib." };
  const row = { letter: p.letter, name: p.name.trim(), tagline: p.tagline, description: p.description, traits: p.traits, sort_order: p.sort_order, is_active: p.is_active };
  // upsert by letter (PK)
  const { error } = await supabase.from("compass_types").upsert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/kompas");
  return { error: null };
}

type CompassQuestionPayload = { id?: string; text: string; letter: string; sort_order: number; is_active: boolean };
export async function saveCompassQuestionAction(p: CompassQuestionPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.text.trim()) return { error: "Pertanyaan wajib." };
  if (!["R","I","A","S","E","C"].includes(p.letter)) return { error: "Letter harus salah satu dari R/I/A/S/E/C." };
  const row = { text: p.text.trim(), letter: p.letter, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("compass_questions").update(row).eq("id", p.id) : supabase.from("compass_questions").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/kompas");
  return { error: null };
}
export async function deleteCompassQuestionAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("compass_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/kompas");
  return { error: null };
}

type CompassMajorPayload = { id?: string; name: string; description: string; primary_letters: string[]; careers: string[]; sort_order: number; is_active: boolean };
export async function saveCompassMajorAction(p: CompassMajorPayload): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!p.name.trim()) return { error: "Nama jurusan wajib." };
  if (p.primary_letters.length === 0) return { error: "Pilih minimal 1 letter RIASEC." };
  const row = { name: p.name.trim(), description: p.description, primary_letters: p.primary_letters, careers: p.careers, sort_order: p.sort_order, is_active: p.is_active };
  const q = p.id ? supabase.from("compass_majors").update(row).eq("id", p.id) : supabase.from("compass_majors").insert(row);
  const { error } = await q; if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/kompas");
  return { error: null };
}
export async function deleteCompassMajorAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("compass_majors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games"); revalidatePath("/main/kompas");
  return { error: null };
}
