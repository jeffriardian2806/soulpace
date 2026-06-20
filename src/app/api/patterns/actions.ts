"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDismissCooldownHours, type PatternNudge } from "@/lib/patterns/detect";

export async function dismissPatternAction(
  patternType: PatternNudge["type"]
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cooldownHours = getDismissCooldownHours(patternType);
  const dismissedUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("pattern_dismissals")
    .upsert({
      user_id: user.id,
      pattern_type: patternType,
      dismissed_until: dismissedUntil,
      dismissed_at: new Date().toISOString(),
    }, { onConflict: "user_id,pattern_type" });

  if (error) return { error: error.message };
  revalidatePath("/feed");
  revalidatePath("/main");
  return { error: null };
}
