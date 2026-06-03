"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { DomainError } from "@/core/errors";

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
