"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepliesService } from "@/modules/replies";
import { DomainError } from "@/core/errors";

export type ReplyState = { error: string | null };

export async function createReplyAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("post_id"));
  const body = String(formData.get("body") ?? "");
  const isSurvivor = formData.get("is_survivor") === "1";

  try {
    const svc = await getRepliesService();
    await svc.create(user.id, postId, body, isSurvivor);
  } catch (e) {
    return { error: e instanceof DomainError ? e.message : "Gagal mengirim balasan." };
  }
  revalidatePath(`/post/${postId}`);
  return { error: null };
}
