import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CbtScenarioEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Tantang Pikiran (CBT) — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("cbt_scenarios").select("id, context, thoughts, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="🌀 Tantang Pikiran (CBT)" subtitle="Skenario pikiran distorsi vs netral vs sehat (CBT).">
      <CbtScenarioEditor items={(q0 ?? []) as { id: string; context: string; thoughts: { text: string; correct: "distorsi" | "netral" | "sehat"; insight: string; distortion_type?: string | null }[]; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
