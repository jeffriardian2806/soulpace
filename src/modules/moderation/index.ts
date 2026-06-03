import { createClient } from "@/lib/supabase/server";
import { SupabaseReportsRepository } from "./data/supabase-reports.repository";
import { ModerationService } from "./services/moderation.service";

export async function getModerationService(): Promise<ModerationService> {
  const supabase = await createClient();
  const repo = new SupabaseReportsRepository(supabase);
  return new ModerationService(repo);
}
