import { createClient } from "@/lib/supabase/server";
import { SupabasePostsRepository } from "./data/supabase-posts.repository";
import { PostsService } from "./services/posts.service";

// Composition root server-side: Supabase -> repo -> service.
export async function getPostsService(): Promise<PostsService> {
  const supabase = await createClient();
  const repo = new SupabasePostsRepository(supabase);
  return new PostsService(repo);
}
