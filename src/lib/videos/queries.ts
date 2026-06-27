import { createClient } from "@/lib/supabase/server";

export type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  category_slug: string | null;
  sort_order: number;
  is_active: boolean;
  total_views: number;
  unique_viewers: number;
  created_at: string;
};

export type VideoSort = "terbaru" | "terpopuler" | "kurasi";

/** Video aktif buat tampil publik di /edukasi.
 *  - kurasi: ikut sort_order admin (default seed)
 *  - terbaru: yang baru diinput admin di atas
 *  - terpopuler: paling banyak ditonton di APP (total_views), data tracking
 */
export async function getActiveVideos(sort: VideoSort = "terbaru"): Promise<VideoRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("videos")
    .select("id, title, description, youtube_id, thumbnail_url, category_slug, sort_order, is_active, total_views, unique_viewers, created_at")
    .eq("is_active", true);

  if (sort === "terbaru") q = q.order("created_at", { ascending: false });
  else if (sort === "terpopuler") q = q.order("total_views", { ascending: false }).order("created_at", { ascending: false });
  else q = q.order("sort_order").order("created_at", { ascending: false });

  const { data } = await q;
  return (data ?? []) as VideoRow[];
}
