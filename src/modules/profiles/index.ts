import { createClient } from "@/lib/supabase/server";
import { SupabaseProfilesRepository } from "./data/supabase-profiles.repository";
import { ProfilesService } from "./services/profiles.service";

export async function getProfilesService(): Promise<ProfilesService> {
  const supabase = await createClient();
  const repo = new SupabaseProfilesRepository(supabase);
  return new ProfilesService(repo);
}
