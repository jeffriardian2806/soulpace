import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DailyMessageEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Pesan Hari Ini — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("daily_messages").select("id, body, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="💬 Pesan Hari Ini" subtitle="Quote yang muncul di banner atas feed setiap hari.">
      <DailyMessageEditor items={(q0 ?? []) as { id: string; body: string; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
