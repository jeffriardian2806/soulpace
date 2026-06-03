import { ValidationError } from "@/core/errors";
import type { AuthRepository } from "../data/auth.repository";
import type { AuthUser } from "../domain/auth.types";

// Use-case / logic bisnis auth. Validasi hidup di sini, bukan di UI atau DB.
export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  private validate(email: string, password: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError("Format email tidak valid.");
    }
    if (password.length < 8) {
      throw new ValidationError("Kata sandi minimal 8 karakter.");
    }
  }

  async register(email: string, password: string): Promise<AuthUser> {
    this.validate(email, password);
    return this.repo.signUp({ email, password });
  }

  async login(email: string, password: string): Promise<AuthUser> {
    this.validate(email, password);
    return this.repo.signIn({ email, password });
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
