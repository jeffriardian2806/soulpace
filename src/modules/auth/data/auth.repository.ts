import type { AuthUser, Credentials } from "../domain/auth.types";

// Kontrak (interface). Logic bisnis hanya kenal ini, bukan Supabase.
// Mau ganti backend? Cukup bikin implementasi baru dari interface ini.
export interface AuthRepository {
  signUp(creds: Credentials): Promise<AuthUser>;
  signIn(creds: Credentials): Promise<AuthUser>;
  signInAnonymously(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
