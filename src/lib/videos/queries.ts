import { createClient } from "@/lib/supabase/server";

export type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  category_id: number | null;
  sort_order: number;
  is_active: boolean;
  total_views: number;
  unique_viewers: number;
};

/** Video aktif buat tampil publik di /edukasi. */
export async function getActiveVideos(): Promise<VideoRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select(
      "id, title, description, youtube_id, thumbnail_url, category_id, sort_order, is_active, total_views, unique_viewers"
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return (data ?? []) as VideoRow[];
}
