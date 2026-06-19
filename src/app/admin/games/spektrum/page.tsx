import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonalityCategoryEditor, PersonalityQuestionEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Spektrum Sosial — Admin Soulpace" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [{ data: q0 }, { data: q1 }] = await Promise.all([
    supabase.from("personality_categories").select("id, slug, name, emoji, description, sort_order, is_active").order("sort_order"),
    supabase.from("personality_questions").select("id, category_id, text, options, sort_order, is_active").order("sort_order"),
  ]);

  return (
    <AdminPageShell title="🌗 Spektrum Sosial" subtitle="Kategori + pertanyaan introvert/extrovert (Big Five).">
      <PersonalityCategoryEditor items={(q0 ?? []) as { id: string; slug: string; name: string; emoji: string; description: string; sort_order: number; is_active: boolean }[]} />
      <PersonalityQuestionEditor items={(q1 ?? []) as { id: string; category_id: string; text: string; options: { text: string; intro_weight: number; extro_weight: number }[]; sort_order: number; is_active: boolean }[]} categories={(q0 ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))} />
    </AdminPageShell>
  );
}
