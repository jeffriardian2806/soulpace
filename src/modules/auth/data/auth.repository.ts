import type { AuthUser } from "../domain/auth.types";

// Kontrak (interface). Logic bisnis hanya kenal ini, bukan Supabase.
// Mau ganti backend? Cukup bikin implementasi baru dari interface ini.
export interface AuthRepository {
  // Kirim kode OTP ke email. Email baru otomatis dibuatkan akun.
  sendOtp(email: string): Promise<void>;
  verifyOtp(email: string, token: string): Promise<AuthUser>;
  signInAnonymously(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
