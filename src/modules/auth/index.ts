import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthRepository } from "./data/supabase-auth.repository";
import { AuthService } from "./services/auth.service";

// Composition root untuk server-side: rakit Supabase -> repo -> service.
// Arah dependensi: app -> service -> repository(interface) <- impl Supabase.
export async function getAuthService(): Promise<AuthService> {
  const supabase = await createClient();
  const repo = new SupabaseAuthRepository(supabase);
  return new AuthService(repo);
}
