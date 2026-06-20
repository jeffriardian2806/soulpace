"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertMod() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) return { error: "Forbidden", supabase: null };
  return { error: null, supabase };
}

export async function saveMediaAction(p: {
  id?: string;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  kind: "audio" | "video_direct" | "video_youtube" | "video_vimeo";
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  tags: string[];
  sort_order: number;
  is_active: boolean;
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  if (!p.slug.trim() || !p.title.trim()) return { error: "Slug & title wajib." };
  if (p.is_active && !p.media_url.trim()) return { error: "Media URL wajib kalau mau di-activate." };

  const row = {
    slug: p.slug.trim(),
    title: p.title.trim(),
    description: p.description.trim() || null,
    emoji: p.emoji.trim() || null,
    kind: p.kind,
    media_url: p.media_url.trim() || null,
    thumbnail_url: p.thumbnail_url.trim() || null,
    duration_seconds: p.duration_seconds,
    tags: p.tags.map(t => t.trim()).filter(Boolean),
    sort_order: p.sort_order,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };

  const q = p.id
    ? supabase.from("ambient_media").update(row).eq("id", p.id)
    : supabase.from("ambient_media").insert(row);
  const { error } = await q;
  if (error) return { error: error.message };

  revalidatePath("/ambient");
  revalidatePath("/admin/games/ambient-media");
  return { error: null };
}

export async function deleteMediaAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertMod();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("ambient_media").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ambient");
  revalidatePath("/admin/games/ambient-media");
  return { error: null };
}
