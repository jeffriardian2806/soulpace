import type { SupabaseClient, User } from "@supabase/supabase-js";
import { AuthError } from "@/core/errors";
import type { AuthRepository } from "./auth.repository";
import type { AuthUser, Credentials } from "../domain/auth.types";

// Satu-satunya tempat yang "tahu" Supabase untuk urusan auth.
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email ?? null,
      isAnonymous: user.is_anonymous ?? false,
    };
  }

  async signUp(creds: Credentials): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signUp(creds);
    if (error || !data.user) throw new AuthError(error?.message ?? "Gagal mendaftar.");
    return this.toAuthUser(data.user);
  }

  async signIn(creds: Credentials): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signInWithPassword(creds);
    if (error || !data.user) throw new AuthError(error?.message ?? "Email atau kata sandi salah.");
    return this.toAuthUser(data.user);
  }

  async signInAnonymously(): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signInAnonymously();
    if (error || !data.user) throw new AuthError(error?.message ?? "Gagal masuk sebagai tamu.");
    return this.toAuthUser(data.user);
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new AuthError(error.message);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user ? this.toAuthUser(data.user) : null;
  }
}
