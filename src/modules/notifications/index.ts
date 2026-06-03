import { createClient } from "@/lib/supabase/server";
import { SupabaseNotificationsRepository } from "./data/supabase-notifications.repository";
import { NotificationsService } from "./services/notifications.service";

export async function getNotificationsService(): Promise<NotificationsService> {
  const supabase = await createClient();
  const repo = new SupabaseNotificationsRepository(supabase);
  return new NotificationsService(repo);
}
