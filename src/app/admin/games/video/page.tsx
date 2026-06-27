import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { VideoEditor } from "./VideoEditor";

export const metadata = { title: "Video Edukasi — Admin Flouwell" };

export default async function AdminVideoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [videosRes, catsRes] = await Promise.all([
    supabase.from("videos").select("id, title, description, youtube_id, thumbnail_url, category_id, is_active, total_views, unique_viewers").order("sort_order"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <AdminPageShell title="🎬 Video Edukasi" subtitle="Video YouTube buat halaman Edukasi (publik). Input link, sistem ambil thumbnail otomatis. Statistik view buat klaim/kurasi.">
      <VideoEditor
        videos={(videosRes.data ?? []) as Parameters<typeof VideoEditor>[0]["videos"]}
        categories={(catsRes.data ?? []) as Parameters<typeof VideoEditor>[0]["categories"]}
      />
    </AdminPageShell>
  );
}
