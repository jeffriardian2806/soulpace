import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DcEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Tantangan Empati — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("daily_challenges").select("id, body").order("sort_order");

  return (
    <AdminPageShell title="🎯 Tantangan Empati" subtitle="Daily challenge yang muncul di /main hub.">
      <DcEditor items={(q0 ?? []) as { id: string; body: string }[]} />
    </AdminPageShell>
  );
}
