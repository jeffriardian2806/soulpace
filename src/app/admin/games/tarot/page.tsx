import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TarotEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Tarot Refleksi — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: q0 } = await supabase.from("tarot_cards").select("id, name, emoji, meaning_situation, meaning_feeling, meaning_action, sort_order, is_active").order("sort_order");

  return (
    <AdminPageShell pageKey="tarot" title="🎴 Tarot Refleksi" subtitle="Kartu + arti per posisi (situasi/perasaan/aksi).">
      <TarotEditor items={(q0 ?? []) as { id: string; name: string; emoji: string; meaning_situation: string; meaning_feeling: string; meaning_action: string; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
