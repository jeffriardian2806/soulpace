"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/videos/youtube";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null, userId: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    return { error: "Not authorized", supabase: null, userId: null };
  }
  return { error: null, supabase, userId: user.id };
}

export async function saveVideoAction(p: {
  id?: string;
  title: string;
  description: string;
  url: string;
  category_id: number | null;
  is_active: boolean;
}): Promise<{ error: string | null }> {
  const { error: authErr, supabase, userId } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  if (!p.title.trim()) return { error: "Judul wajib diisi." };

  const ytId = extractYouTubeId(p.url);
  if (!ytId) return { error: "Link YouTube tidak valid. Pastikan link benar (youtube.com/watch?v=... atau youtu.be/...)." };

  const row = {
    title: p.title.trim(),
    description: p.description.trim() || null,
    platform: "youtube" as const,
    youtube_id: ytId,
    thumbnail_url: youtubeThumbnail(ytId),
    category_id: p.category_id,
    is_active: p.is_active,
    updated_at: new Date().toISOString(),
  };

  if (p.id) {
    const { error } = await supabase.from("videos").update(row).eq("id", p.id);
    if (error) return { error: error.message };
  } else {
    // sort_order auto = jumlah video + 1
    const { count } = await supabase.from("videos").select("id", { count: "exact", head: true });
    const { error } = await supabase.from("videos").insert({
      ...row,
      sort_order: (count ?? 0) + 1,
      created_by: userId,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/games/video");
  revalidatePath("/edukasi");
  return { error: null };
}

export async function toggleVideoAction(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("videos").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games/video");
  revalidatePath("/edukasi");
  return { error: null };
}

export async function deleteVideoAction(id: string): Promise<{ error: string | null }> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/games/video");
  revalidatePath("/edukasi");
  return { error: null };
}

// Statistik periode buat klaim endorsement
export async function getVideoStatsAction(p: {
  videoId: string;
  fromISO: string;
  toISO: string;
}): Promise<{ error: string | null; rows: { day: string; views: number; unique_viewers: number }[] }> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed", rows: [] };
  const { data, error } = await supabase.rpc("video_stats_by_period", {
    p_video: p.videoId,
    p_from: p.fromISO,
    p_to: p.toISO,
  });
  if (error) return { error: error.message, rows: [] };
  return { error: null, rows: (data ?? []) as { day: string; views: number; unique_viewers: number }[] };
}
