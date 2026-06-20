"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createConsultationSession(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login dulu ya." };

  const categorySlug = String(formData.get("category_slug") || "").trim();
  const keluhanText = String(formData.get("keluhan_text") || "").trim();
  const shareToFeed = formData.get("share_to_feed") === "on";

  if (!categorySlug) return { error: "Kategori belum dipilih." };
  if (keluhanText.length < 20) return { error: "Keluhan minimal 20 karakter." };
  if (keluhanText.length > 2000) return { error: "Keluhan maksimal 2000 karakter." };

  // Get category id
  const { data: cat } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!cat) return { error: "Kategori invalid." };

  // Optional: create public post if user opt-in
  let sharedPostId: string | null = null;
  if (shareToFeed) {
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        category_id: cat.id,
        body: keluhanText,
        status: "active",
      })
      .select("id")
      .single();
    if (postErr) return { error: "Gagal posting ke feed: " + postErr.message };
    sharedPostId = post?.id ?? null;
  }

  // Create consultation session
  const { data: session, error: sessionErr } = await supabase
    .from("consultation_sessions")
    .insert({
      user_id: user.id,
      category_id: cat.id,
      keluhan_text: keluhanText,
      is_shared_to_feed: shareToFeed,
      shared_post_id: sharedPostId,
    })
    .select("id")
    .single();

  if (sessionErr) return { error: "Gagal simpan sesi: " + sessionErr.message };

  revalidatePath("/konsultasi");
  revalidatePath("/konsultasi/history");
  if (shareToFeed) revalidatePath("/feed");

  redirect(`/konsultasi/${session.id}`);
}

export async function deleteConsultationSession(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("consultation_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/konsultasi/history");
  return { error: null };
}
