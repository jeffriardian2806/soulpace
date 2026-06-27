import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VibeEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Vibe Presets — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("vibe_presets").select("id, emoji, label, href").order("sort_order");

  return (
    <AdminPageShell title="🎨 Vibe Presets" subtitle="Shortcut emoji-label di hub /main (Lagi pengen apa?).">
      <VibeEditor items={(q0 ?? []) as { id: string; emoji: string; label: string; href: string }[]} />
    </AdminPageShell>
  );
}
