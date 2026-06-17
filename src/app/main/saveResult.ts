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
 * Ngikut pattern quiz_results: INSERT per attempt, latest diambil via ORDER BY created_at DESC.
 *
 * Plus: panggil consume_feature_token RPC buat charge user kalau fitur ditandai premium di feature_flags.
 * Kalau fitur free (is_premium=false), RPC cuma log akses gratis (ga charge).
 * Kalau user punya subscription aktif, bypass charge.
 * Kalau token cukup, deduct.
 * Kalau token kurang, log error tapi save TETAP jalan (karena user udah lewatin PremiumGate di awal, jadi kemungkinan ini race — tetep simpan hasil).
 *
 * Guest user → skip semua (tidak save, tidak charge).
 */
export async function saveGameResultAction(
  gameKey: string,
  summary: GameSummary,
  detail?: unknown
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: null }; // guest — skip silent

  // Save dulu
  const { error } = await supabase.from("user_game_results").insert({
    user_id: user.id,
    game_key: gameKey,
    summary,
    detail: detail ?? null,
  });
  if (error) return { error: error.message };

  // Lalu consume token / log akses (best-effort, ga halt flow kalau gagal)
  try {
    await supabase.rpc("consume_feature_token", { p_feature_slug: gameKey });
  } catch {
    // silent — udah ke-save, tinggal error log monetisasi yang miss
  }

  revalidatePath("/profile");
  revalidatePath("/riwayat");
  return { error: null };
}

/**
 * Untuk fitur yang ga lewat saveGameResultAction (mis. content browsing, casual exercises).
 * Server action ringan buat track akses + consume token kalau premium.
 */
export async function markFeatureUsedAction(slug: string): Promise<{ ok: boolean; mode?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: true, mode: "guest" };

  try {
    const { data } = await supabase.rpc("consume_feature_token", { p_feature_slug: slug });
    const r = data as { ok: boolean; mode?: string; error?: string };
    return r;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
