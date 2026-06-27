import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TotEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "This or That — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("this_or_that").select("id, prompt_a, prompt_b").order("sort_order");

  return (
    <AdminPageShell title="🌙 This or That" subtitle="Pilihan A/B check-in cepat.">
      <TotEditor items={(q0 ?? []) as { id: string; prompt_a: string; prompt_b: string }[]} />
    </AdminPageShell>
  );
}
