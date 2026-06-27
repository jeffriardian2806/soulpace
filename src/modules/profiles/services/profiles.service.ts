import { ValidationError } from "@/core/errors";
import type { ProfilesRepository } from "../data/profiles.repository";
import type { Profile } from "@/core/entities/profile";

const RESERVED = [
  "admin", "administrator", "moderator", "mod", "soulpace", "flouwell",
  "support", "official", "root", "system",
];

// Daftar contoh — WAJIB diperluas sebelum go live.
const PROFANITY = [
  "anjing", "bangsat", "kontol", "memek", "ngentot", "jancok",
  "babi", "tolol", "goblok", "bajingan",
];

export class ProfilesService {
  constructor(private readonly repo: ProfilesRepository) {}

  getProfile(userId: string): Promise<Profile | null> {
    return this.repo.getById(userId);
  }

  setSurvivor(userId: string, value: boolean): Promise<void> {
    return this.repo.setSurvivor(userId, value);
  }

  async changeHandle(userId: string, raw: string): Promise<void> {
    const handle = raw.trim();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(handle)) {
      throw new ValidationError(
        "Handle 3-20 karakter, hanya huruf, angka, dan underscore."
      );
    }
    const lower = handle.toLowerCase();
    if (RESERVED.includes(lower)) {
      throw new ValidationError("Handle itu tidak boleh dipakai.");
    }
    if (PROFANITY.some((w) => lower.includes(w))) {
      throw new ValidationError("Handle mengandung kata yang tidak pantas.");
    }

    const prof = await this.repo.getById(userId);
    if (prof?.handleChangedAt) {
      const days =
        (Date.now() - new Date(prof.handleChangedAt).getTime()) / 86400000;
      if (days < 30) {
        throw new ValidationError(
          `Handle baru bisa diganti lagi dalam ${Math.ceil(30 - days)} hari.`
        );
      }
    }

    try {
      await this.repo.updateHandle(userId, handle);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/duplicate|unique/i.test(msg)) {
        throw new ValidationError("Handle sudah dipakai, coba yang lain.");
      }
      throw e;
    }
  }
}
