"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveSupportMessage } from "@/lib/support/resolveMessage";

type TriggerType = "crisis_screening" | "severe_screening" | "low_mood_streak";

export async function getSupportMessageAction(triggerType: TriggerType): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return resolveSupportMessage(triggerType, user.id);
}
