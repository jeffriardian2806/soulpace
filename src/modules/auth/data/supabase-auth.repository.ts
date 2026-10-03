import type { SupabaseClient, User } from "@supabase/supabase-js";
import { AuthError } from "@/core/errors";
import type { AuthRepository } from "./auth.repository";
import type { AuthUser } from "../domain/auth.types";

// Terjemahin error code Supabase ke pesan yang ramah. Yang gak dikenal -> fallback.
function otpErrorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case "email_address_invalid":
      return "Format email tidak valid.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu sering minta kode. Tunggu sebentar lalu coba lagi.";
    // Supabase pakai code yang sama buat kode salah DAN kode kedaluwarsa.
    case "otp_expired":
      return "Kode salah atau sudah kedaluwarsa. Cek lagi, atau minta kode baru.";
    case "signup_disabled":
    case "otp_disabled":
      return "Pendaftaran lagi ditutup sementara.";
    default:
      return fallback;
  }
}

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

  async sendOtp(email: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw new AuthError(otpErrorMessage(error.code, "Gagal mengirim kode. Coba lagi."));
  }

  async verifyOtp(email: string, token: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) {
      throw new AuthError(otpErrorMessage(error?.code, "Kode tidak bisa diverifikasi. Coba lagi."));
    }
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
