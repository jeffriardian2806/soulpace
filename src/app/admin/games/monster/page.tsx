import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MonsterEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Monster Cemas — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("monster_situations").select("id, situation, responses, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="👹 Monster Cemas" subtitle="Situasi cemas + respons (grow/shrink/stay) + insight.">
      <MonsterEditor items={(q0 ?? []) as { id: string; situation: string; responses: { text: string; effect: "grow" | "shrink" | "stay"; insight: string }[]; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
