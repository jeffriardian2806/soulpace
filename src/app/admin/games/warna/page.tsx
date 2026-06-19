import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MoodColorEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Warna Hari Ini — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("mood_colors").select("id, hex, label, note, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="🎨 Warna Hari Ini" subtitle="Daftar warna + label + note pendek.">
      <MoodColorEditor items={(q0 ?? []) as { id: string; hex: string; label: string; note: string; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
