import { ValidationError } from "@/core/errors";
import type { AuthRepository } from "../data/auth.repository";
import type { AuthUser } from "../domain/auth.types";

// Use-case / logic bisnis auth. Validasi hidup di sini, bukan di UI atau DB.
export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  private normalizeEmail(email: string): string {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      throw new ValidationError("Format email tidak valid.");
    }
    return clean;
  }

  // Login & daftar jadi satu: email belum terdaftar otomatis dibuatkan akun.
  async requestOtp(email: string): Promise<void> {
    return this.repo.sendOtp(this.normalizeEmail(email));
  }

  async verifyOtp(email: string, token: string): Promise<AuthUser> {
    const clean = this.normalizeEmail(email);
    const code = token.trim();
    if (!/^\d{6}$/.test(code)) {
      throw new ValidationError("Kode harus 6 digit angka.");
    }
    return this.repo.verifyOtp(clean, code);
  }

  async loginAsGuest(): Promise<AuthUser> {
    return this.repo.signInAnonymously();
  }

  async logout(): Promise<void> {
    return this.repo.signOut();
  }

  async me(): Promise<AuthUser | null> {
    return this.repo.getCurrentUser();
  }
}
