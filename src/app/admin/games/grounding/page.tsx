import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroundingEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Grounding 5-4-3-2-1 — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("grounding_steps").select("id, count, sense, instr, emoji, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell pageKey="grounding" title="🧭 Grounding 5-4-3-2-1" subtitle="5 step indera (lihat/dengar/sentuh/cium/cicipi) buat anxiety.">
      <GroundingEditor items={(q0 ?? []) as { id: string; count: number; sense: string; instr: string; emoji: string; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
