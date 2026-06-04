"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { DomainError } from "@/core/errors";
import type { FeedPost } from "@/core/entities/post";

export type ComposeState = { error: string | null };

export async function createPostAction(
  _prev: ComposeState,
  formData: FormData
): Promise<ComposeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categoryId = Number(formData.get("category_id"));
  const body = String(formData.get("body") ?? "");

  try {
    const svc = await getPostsService();
    await svc.createPost(user.id, categoryId, body);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Gagal mengirim curhat." };
  }
  revalidatePath("/feed");
  redirect("/feed");
}

export async function togglePelukAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("post_id"));
  const peluked = formData.get("peluked") === "1";

  const svc = await getPostsService();
  await svc.togglePeluk(postId, user.id, peluked);
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
}

// Peluk imperatif untuk optimistic UI di client.
// Sengaja TIDAK revalidatePath("/feed") supaya state infinite-scroll ga ke-reset.
export async function pelukAction(
  postId: string,
  currentlyPeluked: boolean
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getPostsService();
  await svc.togglePeluk(postId, user.id, currentlyPeluked);
  revalidatePath(`/post/${postId}`);
}

// Ambil halaman feed berikutnya (infinite scroll).
// OPTIMIZED: Uses combined query for posts + peluked in single DB operation
export async function loadMoreFeed(
  cat: string | null,
  offset: number,
  limit: number
): Promise<{ posts: FeedPost[]; peluked: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = await getPostsService();
  // This now combines posts + peluked in single query via feedPage method
  return svc.feedPage(cat ?? undefined, offset, limit, user?.id ?? null);
}

// Prefetch category data in background (no-op if already cached)
// This runs silently on hover, improving perceived performance
export async function prefetchFeedCategory(slug: string): Promise<void> {
  try {
    const svc = await getPostsService();
    // Simply call getFeed to populate service cache
    // Categories are cached at repository level (1 hour TTL)
    await svc.getFeed({ categorySlug: slug });
  } catch {
    // Silently fail, this is just a prefetch hint
  }
}
