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
