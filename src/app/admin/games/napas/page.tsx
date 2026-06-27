import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BreathingEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Tarik Napas — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("breathing_protocols").select("id, slug, label, in_seconds, hold_seconds, out_seconds, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="🫧 Tarik Napas" subtitle="Protokol pernapasan (4-7-8, box breathing, dsb).">
      <BreathingEditor items={(q0 ?? []) as { id: string; slug: string; label: string; in_seconds: number; hold_seconds: number; out_seconds: number; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
