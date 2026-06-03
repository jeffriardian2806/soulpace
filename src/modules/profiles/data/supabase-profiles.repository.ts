import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfilesRepository } from "./profiles.repository";
import type { Profile } from "@/core/entities/profile";

export class SupabaseProfilesRepository implements ProfilesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, handle, is_survivor, role, handle_changed_at, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const r = data as any;
    return {
      id: r.id,
      handle: r.handle,
      isSurvivor: r.is_survivor,
      role: r.role,
      handleChangedAt: r.handle_changed_at,
      createdAt: r.created_at,
    };
  }

  async updateHandle(userId: string, handle: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({ handle, handle_changed_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  async setSurvivor(userId: string, value: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({ is_survivor: value })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }
}
