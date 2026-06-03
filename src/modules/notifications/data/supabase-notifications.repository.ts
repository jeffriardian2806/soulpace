import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationsRepository } from "./notifications.repository";
import type { AppNotification } from "@/core/entities/notification";

export class SupabaseNotificationsRepository implements NotificationsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string): Promise<AppNotification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("id, type, actor_handle, post_id, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      actorHandle: r.actor_handle,
      postId: r.post_id,
      read: r.read,
      createdAt: r.created_at,
    }));
  }

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
  }
}
