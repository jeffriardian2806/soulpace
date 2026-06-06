"use server";

import { createClient } from "@/lib/supabase/server";

type State = { error: string | null; success?: boolean };

export async function createFeedbackAction(
  _prev: State,
  fd: FormData
): Promise<State> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Kamu harus masuk dulu." };

  const rating = Number(fd.get("rating") ?? 0);
  const comment = String(fd.get("comment") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pilih rating bintang dulu." };
  }

  const { error } = await supabase.from("app_feedback").insert({
    user_id: user.id,
    rating,
    comment: comment ? comment.slice(0, 2000) : null,
  });
  if (error) return { error: "Gagal mengirim, coba lagi." };
  return { error: null, success: true };
}
