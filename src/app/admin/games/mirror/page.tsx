import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MirrorProfileEditor, MirrorScenarioEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Pikiran Mirror — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [{ data: q0 }, { data: q1 }] = await Promise.all([
    supabase.from("mirror_profiles").select("id, slug, name, emoji, description, insight, sort_order, is_active").order("sort_order"),
    supabase.from("mirror_scenarios").select("id, category, situation, options, sort_order, is_active").order("sort_order"),
  ]);

  return (
    <AdminPageShell title="🪞 Pikiran Mirror" subtitle="Profile (archetype) + skenario 10 situasi hidup.">
      <MirrorProfileEditor items={(q0 ?? []) as { id: string; slug: string; name: string; emoji: string; description: string; insight: string; sort_order: number; is_active: boolean }[]} />
      <MirrorScenarioEditor items={(q1 ?? []) as { id: string; category: string; situation: string; options: { text: string; profile_slug: string }[]; sort_order: number; is_active: boolean }[]} profiles={(q0 ?? []).map((p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name }))} />
    </AdminPageShell>
  );
}
