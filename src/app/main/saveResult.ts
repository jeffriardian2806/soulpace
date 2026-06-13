"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type GameSummary = {
  title: string;
  headline: string;
  value?: string;
  secondary?: string;
  emoji?: string;
};

/**
 * Simpan hasil game / skrining ke user_game_results.
 * Diam-diam skip kalau user ga login (guest mode).
 * Ngikut pattern quiz_results: INSERT per attempt, latest diambil via query ORDER BY created_at DESC.
 */
export async function saveGameResultAction(
  gameKey: string,
  summary: GameSummary,
  detail?: unknown
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: null }; // guest — ga error keras, cuma skip

  const { error } = await supabase.from("user_game_results").insert({
    user_id: user.id,
    game_key: gameKey,
    summary,
    detail: detail ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { error: null };
}
