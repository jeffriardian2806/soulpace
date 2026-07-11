import { createClient } from "@/lib/supabase/server";

/** Fetch banyak key ui_texts sekaligus, fallback ke defaults kalau kosong. */
export async function getUiTexts(keys: string[], defaults: Record<string, string>): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...defaults };
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("ui_texts").select("key, value").in("key", keys);
    for (const row of data ?? []) {
      if (row.value && row.value.trim()) out[row.key] = row.value;
    }
  } catch { /* fallback default */ }
  return out;
}
