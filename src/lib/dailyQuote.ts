import { createClient } from "@/lib/supabase/server";

const FALLBACK = "Pelan-pelan nggak apa-apa. Yang penting kamu nggak berhenti.";

/**
 * Deterministik per hari: quote sama sepanjang hari, ganti tiap hari.
 * Ambil dari tabel daily_messages (is_active=true). Fallback static kalo DB kosong.
 */
export async function getDailyQuote(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_messages")
    .select("body")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const rows = (data ?? []) as { body: string }[];
  if (rows.length === 0) return FALLBACK;
  const day = Math.floor(Date.now() / 86400000);
  return rows[day % rows.length].body;
}
