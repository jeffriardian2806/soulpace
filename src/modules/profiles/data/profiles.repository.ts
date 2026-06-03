import type { Profile } from "@/core/entities/profile";

export interface ProfilesRepository {
  getById(userId: string): Promise<Profile | null>;
  updateHandle(userId: string, handle: string): Promise<void>;
  setSurvivor(userId: string, value: boolean): Promise<void>;
}
