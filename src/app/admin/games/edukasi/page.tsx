import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TipsEditor } from "@/components/admin/TipsEditor";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Tips & Edukasi — Admin Soulpace" };

export default async function AdminEdukasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [topicsRes, tipsRes] = await Promise.all([
    supabase.from("tip_topics").select("id, slug, title, emoji, definition, sort_order, is_active").order("sort_order"),
    supabase.from("tips").select("id, topic_slug, topic_title, topic_emoji, tip_title, tip_content, sort_order, is_active").order("topic_slug").order("sort_order"),
  ]);

  return (
    <AdminPageShell title="📚 Tips & Edukasi" subtitle="Topic per kondisi (definisi + tips actionable). Klik topic buat expand & edit.">
      <TipsEditor
        topics={(topicsRes.data ?? []) as Parameters<typeof TipsEditor>[0]["topics"]}
        tips={(tipsRes.data ?? []) as Parameters<typeof TipsEditor>[0]["tips"]}
      />
    </AdminPageShell>
  );
}
