"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { DomainError } from "@/core/errors";
import { getMood } from "@/core/moods";
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

  const rawCat = formData.get("category_id");
  const categoryId = rawCat ? Number(rawCat) : null;
  const body = String(formData.get("body") ?? "");
  const mood = (formData.get("mood") as string) || null;
  const wish = (formData.get("wish") as string) || null;

  try {
    const svc = await getPostsService();
    await svc.createPost(user.id, categoryId, body, mood, wish);
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

// Quick mood status dari mood check-in (tanpa kategori, body auto kalau kosong).
export async function createStatusAction(
  mood: string,
  text: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = getMood(mood);
  const body = text.trim() || `Lagi ngerasa ${m?.label.toLowerCase() ?? "begini"}.`;

  try {
    const svc = await getPostsService();
    await svc.createPost(user.id, null, body, mood, null);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Gagal membagikan status." };
  }
  revalidatePath("/feed");
  return { error: null };
}

// Halaman feed berikutnya (infinite scroll): posts + peluked dalam satu method.
export async function loadMoreFeed(
  cat: string | null,
  offset: number,
  limit: number,
  onlyUnanswered = false,
  wish?: string
): Promise<{ posts: FeedPost[]; peluked: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const svc = await getPostsService();
  return svc.feedPage(cat ?? undefined, offset, limit, user?.id ?? null, onlyUnanswered, wish);
}

export async function editPostAction(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "");
  const mood = (formData.get("mood") as string) || null;
  const wish = (formData.get("wish") as string) || null;
  if (!postId) return { error: "Post tidak valid." };
  try {
    const svc = await getPostsService();
    await svc.updatePost(postId, user.id, body, mood, wish);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Gagal nyimpen perubahan." };
  }
  revalidatePath("/feed");
  redirect("/feed");
}
