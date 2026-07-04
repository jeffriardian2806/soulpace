"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveAuraSnapshot(p: {
  mood_key: string;
  aura_label: string;
  mood_text: string;
  energy: number;
  body_signal: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Harus login buat simpan." };
  const { error } = await supabase.from("aura_snapshots").insert({
    user_id: user.id,
    mood_key: p.mood_key,
    aura_label: p.aura_label,
    mood_text: p.mood_text,
    energy: p.energy,
    body_signal: p.body_signal,
  });
  if (error) return { error: error.message };
  return { error: null };
}
