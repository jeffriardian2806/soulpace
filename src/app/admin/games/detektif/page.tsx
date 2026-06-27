import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetectiveEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Detektif Emosi — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("detective_cases").select("id, content, correct, options, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="🔍 Detektif Emosi" subtitle="Kasus chat + tebakan emosi (EQ training).">
      <DetectiveEditor items={(q0 ?? []) as { id: string; content: string; correct: string; options: { slug: string; label: string; explanation: string }[]; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
