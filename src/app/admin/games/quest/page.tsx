import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestPromptsEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "7 Hari Kenal Diri — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("quest_prompts").select("day, prompt").order("day");

  return (
    <AdminPageShell pageKey="quest" title="🗺️ 7 Hari Kenal Diri" subtitle="Prompt per hari (1-7).">
      <QuestPromptsEditor items={(q0 ?? []) as { day: number; prompt: string }[]} />
    </AdminPageShell>
  );
}
