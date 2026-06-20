import { createClient } from "@/lib/supabase/server";

export type PatternNudge = {
  type: "low_mood_streak" | "severe_screening_recent" | "mood_checkin_missing";
  priority: number; // higher = more urgent
  emoji: string;
  title: string;
  message: string;
  primary_action: { label: string; href: string };
  secondary_action?: { label: string; href: string };
};

// Cooldown per pattern type (hours)
const DISMISS_COOLDOWN: Record<PatternNudge["type"], number> = {
  low_mood_streak: 24,
  severe_screening_recent: 48,
  mood_checkin_missing: 72,
};

/**
 * Detect aktif nudge buat user, return tertinggi priority.
 * Returns null kalau ga ada pattern aktif atau semua di-dismiss.
 */
export async function detectPatternNudge(): Promise<PatternNudge | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch active dismissals
  const { data: dismissals } = await supabase
    .from("pattern_dismissals")
    .select("pattern_type, dismissed_until")
    .eq("user_id", user.id)
    .gt("dismissed_until", new Date().toISOString());

  const dismissedSet = new Set((dismissals ?? []).map(d => d.pattern_type));

  const candidates: PatternNudge[] = [];

  // === Pattern 1: low_mood_streak (3+ consecutive days mood ≤2) ===
  if (!dismissedSet.has("low_mood_streak")) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: moods } = await supabase
      .from("mood_entries")
      .select("entry_date, mood")
      .eq("user_id", user.id)
      .gte("entry_date", sevenDaysAgo)
      .order("entry_date", { ascending: false })
      .limit(7);

    if (moods && moods.length >= 3) {
      // Check 3 most recent are all ≤2
      const last3 = moods.slice(0, 3);
      const allLow = last3.every(m => m.mood <= 2);
      if (allLow) {
        candidates.push({
          type: "low_mood_streak",
          priority: 80,
          emoji: "💙",
          title: "Mood lo lagi berat beberapa hari ini.",
          message: "Iya, gw notice. Lo ga harus solve semuanya hari ini. Mau cek tools yang udah lo siapin?",
          primary_action: { label: "🛟 Buka Safety Plan", href: "/safety-plan" },
          secondary_action: { label: "🌬️ Latihan Napas", href: "/main/napas" },
        });
      }
    }
  }

  // === Pattern 2: severe_screening_recent (skrining berat <7 hari) ===
  if (!dismissedSet.has("severe_screening_recent")) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: results } = await supabase
      .from("user_game_results")
      .select("game_key, summary, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    type GameResult = {
      game_key: string;
      summary: { headline?: string; severity?: string; band?: string; risk_level?: string } | null;
      created_at: string;
    };

    const severeMarkers = ["berat", "severe", "tinggi", "high", "crisis", "kritis"];
    const hasSevere = (results as GameResult[] | null)?.some(r => {
      const text = JSON.stringify(r.summary ?? {}).toLowerCase();
      return severeMarkers.some(m => text.includes(m));
    });

    if (hasSevere) {
      candidates.push({
        type: "severe_screening_recent",
        priority: 90,
        emoji: "🌿",
        title: "Skrining lo recent nunjukin tingkat yang significant.",
        message: "Skrining bukan diagnosis, tapi sinyal. Worth ngobrol sama profesional yang qualified. Soulpace bukan terapi.",
        primary_action: { label: "🌐 Lihat Pusat Bantuan", href: "/resource" },
        secondary_action: { label: "🛟 Cek Safety Plan", href: "/safety-plan" },
      });
    }
  }

  // === Pattern 3: mood_checkin_missing (>7 hari ga checkin) ===
  if (!dismissedSet.has("mood_checkin_missing")) {
    const { data: lastMood } = await supabase
      .from("mood_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMood?.entry_date) {
      const lastDate = new Date(lastMood.entry_date);
      const daysSince = (Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSince >= 7) {
        candidates.push({
          type: "mood_checkin_missing",
          priority: 30,
          emoji: "🌱",
          title: "Udah seminggu ga check-in mood.",
          message: "Quick check-in 10 detik bantu lo notice pola. Bukan keharusan, cuma kalau lo mau.",
          primary_action: { label: "📝 Check-in mood", href: "/mood" },
        });
      }
    }
  }

  // Return highest priority
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.priority - a.priority)[0];
}

export function getDismissCooldownHours(patternType: PatternNudge["type"]): number {
  return DISMISS_COOLDOWN[patternType] ?? 24;
}
