import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BatteryEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Energi Sosial — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("battery_actions").select("id, emoji, label, description, social_delta, energy_delta, productivity_delta, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="🔋 Energi Sosial" subtitle="Aktivitas + delta sosial/energi/produktivitas (simulasi 7 hari).">
      <BatteryEditor items={(q0 ?? []) as { id: string; emoji: string; label: string; description: string; social_delta: number; energy_delta: number; productivity_delta: number; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
