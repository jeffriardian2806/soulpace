"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveQuizResultAction(
  quizKey: string,
  resultKey: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: null }; // tamu: ga disimpan, ga apa-apa
  const { error } = await supabase
    .from("quiz_results")
    .insert({ user_id: user.id, quiz_key: quizKey, result_key: resultKey });
  return { error: error ? error.message : null };
}

export async function saveQuestDayAction(
  day: number,
  body: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const text = body.trim();
  if (!text) return { error: "Isi dulu ya." };
  const { error } = await supabase
    .from("quest_entries")
    .upsert({ user_id: user.id, day, body: text }, { onConflict: "user_id,day" });
  if (error) return { error: error.message };
  revalidatePath("/main/quest");
  return { error: null };
}

export async function votePollAction(
  pollId: string,
  optionIndex: number
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
  if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
  revalidatePath("/main/poll");
  return { error: null };
}

export async function submitRoomEntryAction(
  roomId: string,
  body: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const text = body.trim();
  if (!text || text.length > 280) return { error: "Maksimal 280 karakter." };
  const { error } = await supabase
    .from("room_entries")
    .insert({ room_id: roomId, author_id: user.id, body: text });
  if (error) return { error: error.message };
  revalidatePath("/main/ruang");
  return { error: null };
}
