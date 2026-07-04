"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveScanResult(p: {
  mode: string;
  result: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Harus login buat simpan." };
  const { error } = await supabase.from("scan_results").insert({
    user_id: user.id, mode: p.mode, result: p.result,
  });
  if (error) return { error: error.message };
  return { error: null };
}
