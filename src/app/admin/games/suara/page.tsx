import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoiceEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Suara Dalam Kepala — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("voice_scenarios").select("id, situation, critic_text, supportive_text, outcome_critic, outcome_supportive, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell pageKey="suara" title="🗣️ Suara Dalam Kepala" subtitle="Skenario suara kritis vs supportive + dampak.">
      <VoiceEditor items={(q0 ?? []) as { id: string; situation: string; critic_text: string; supportive_text: string; outcome_critic: string; outcome_supportive: string; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
