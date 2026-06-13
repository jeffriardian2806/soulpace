import { createClient } from "@/lib/supabase/server";

type TriggerType = "crisis_screening" | "severe_screening" | "low_mood_streak";

type SupportTemplate = {
  slug: string;
  template: string;
  required_data: string[];
  weight: number;
};

/**
 * Resolve pesan support buat user di kondisi crisis/severe/mood-streak.
 * 1. Fetch data game user (mirror, kompas, spektrum)
 * 2. Filter template yang required_data nya udah tersedia di user
 * 3. Pick paling spesifik (required_data terbanyak) + weighted random dalam tier yang sama
 * 4. Substitute slot variables
 * Return null kalau ga ada template match (jarang — selalu ada fallback no_data).
 */
export async function resolveSupportMessage(
  triggerType: TriggerType,
  userId: string
): Promise<string | null> {
  const supabase = await createClient();

  // 1. Fetch latest game results per game_key
  const { data: gameRows } = await supabase
    .from("user_game_results")
    .select("game_key, summary, created_at")
    .eq("user_id", userId)
    .in("game_key", ["mirror", "kompas", "spektrum"])
    .order("created_at", { ascending: false });

  type GameRow = { game_key: string; summary: { headline?: string; value?: string } | null };
  const latestByGame = new Map<string, GameRow>();
  ((gameRows ?? []) as GameRow[]).forEach((r) => {
    if (!latestByGame.has(r.game_key)) latestByGame.set(r.game_key, r);
  });

  // 2. Fetch handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", userId)
    .single();

  // 3. Build context
  const mirror = latestByGame.get("mirror");
  const kompas = latestByGame.get("kompas");
  const spektrum = latestByGame.get("spektrum");

  const context: Record<string, string> = {};
  if (profile?.handle) context.handle = profile.handle;
  if (mirror?.summary?.headline) context.mirror_archetype = mirror.summary.headline;
  if (kompas?.summary?.headline) context.kompas_code = kompas.summary.headline;
  if (kompas?.summary?.value) context.kompas_top_name = kompas.summary.value.split(" · ")[0] ?? "";
  if (spektrum?.summary?.headline) context.spektrum_label = spektrum.summary.headline;

  // Map context key to required_data key (sederhana: mirror_archetype -> "mirror", kompas_* -> "kompas", spektrum_* -> "spektrum")
  const availableKeys = new Set<string>();
  if (context.mirror_archetype) availableKeys.add("mirror");
  if (context.kompas_code || context.kompas_top_name) availableKeys.add("kompas");
  if (context.spektrum_label) availableKeys.add("spektrum");

  // 4. Fetch all active templates for this trigger
  const { data: templates } = await supabase
    .from("support_messages")
    .select("slug, template, required_data, weight")
    .eq("trigger_type", triggerType)
    .eq("is_active", true);

  if (!templates || templates.length === 0) return null;

  // 5. Filter templates whose required_data is fully available
  const matched = (templates as SupportTemplate[]).filter((t) => {
    const req = t.required_data ?? [];
    return req.every((k) => availableKeys.has(k));
  });

  if (matched.length === 0) return null;

  // 6. Pick most specific tier (max required_data count), then weighted random within tier
  const maxReq = Math.max(...matched.map((t) => (t.required_data ?? []).length));
  const topTier = matched.filter((t) => (t.required_data ?? []).length === maxReq);

  const totalWeight = topTier.reduce((s, t) => s + (t.weight ?? 1), 0);
  let rand = Math.random() * totalWeight;
  let picked: SupportTemplate = topTier[0];
  for (const t of topTier) {
    rand -= t.weight ?? 1;
    if (rand <= 0) { picked = t; break; }
  }

  // 7. Substitute variables
  let msg = picked.template;
  Object.entries(context).forEach(([k, v]) => {
    if (v) msg = msg.split(`{${k}}`).join(String(v));
  });

  // 8. Cleanup any unfilled {slot} (kalau context kurang lengkap)
  msg = msg.replace(/\{[a-z_]+\}/g, "").replace(/\s+/g, " ").trim();

  return msg;
}
