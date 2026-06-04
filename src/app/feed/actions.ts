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

// Halaman feed berikutnya (infinite scroll): posts + peluked dalam satu method.
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
  return svc.feedPage(cat ?? undefined, offset, limit, user?.id ?? null);
}
