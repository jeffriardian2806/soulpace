import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AmbientMediaEditor } from "@/components/admin/AmbientMediaEditor";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Ambient Media — Admin Soulpace" };

export default async function AdminAmbientMediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase
    .from("ambient_media")
    .select("id, slug, title, description, emoji, kind, media_url, thumbnail_url, duration_seconds, tags, sort_order, is_active")
    .order("sort_order");

  return (
    <AdminPageShell title="🎵 Ambient Media" subtitle="Audio/video calming via external link. Default inaktif — set URL + activate biar muncul di /ambient.">
      <AmbientMediaEditor items={(data ?? []) as Parameters<typeof AmbientMediaEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
