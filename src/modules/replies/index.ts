import { createClient } from "@/lib/supabase/server";
import { SupabaseRepliesRepository } from "./data/supabase-replies.repository";
import { RepliesService } from "./services/replies.service";

export async function getRepliesService(): Promise<RepliesService> {
  const supabase = await createClient();
  const repo = new SupabaseRepliesRepository(supabase);
  return new RepliesService(repo);
}
