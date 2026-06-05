import { createClient } from "@supabase/supabase-js";

// Client anon tanpa sesi, untuk baca data publik di sitemap & generateMetadata
// (tidak butuh cookie / konteks request).
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
