import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportMessageEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Pesan Otomatis (Support) — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("support_messages").select("id, slug, trigger_type, required_data, template, weight, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell title="💙 Pesan Otomatis (Support)" subtitle="Template pesan ke user dalam kondisi crisis/severe screening/mood streak.">
      <SupportMessageEditor items={(q0 ?? []) as { id: string; slug: string; trigger_type: "crisis_screening" | "severe_screening" | "low_mood_streak"; required_data: string[]; template: string; weight: number; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
