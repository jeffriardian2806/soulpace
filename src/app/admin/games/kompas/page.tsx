import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompassTypeEditor, CompassQuestionEditor, CompassMajorEditor } from "@/components/admin/MiscEditors";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Kompas Jurusan — Admin Flouwell" };

export default async function AdminEditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [{ data: q0 }, { data: q1 }, { data: q2 }] = await Promise.all([
    supabase.from("compass_types").select("letter, name, tagline, description, traits, sort_order, is_active").order("sort_order"),
    supabase.from("compass_questions").select("id, text, letter, sort_order, is_active").order("sort_order"),
    supabase.from("compass_majors").select("id, name, description, primary_letters, careers, sort_order, is_active").order("sort_order"),
  ]);

  return (
    <AdminPageShell pageKey="kompas" title="🧭 Kompas Jurusan" subtitle="Tipe RIASEC + pertanyaan + 30 jurusan kuliah (Holland Code).">
      <CompassTypeEditor items={(q0 ?? []) as { letter: string; name: string; tagline: string; description: string; traits: string; sort_order: number; is_active: boolean }[]} />
      <CompassQuestionEditor items={(q1 ?? []) as { id: string; text: string; letter: string; sort_order: number; is_active: boolean }[]} />
      <CompassMajorEditor items={(q2 ?? []) as { id: string; name: string; description: string; primary_letters: string[]; careers: string[]; sort_order: number; is_active: boolean }[]} />
    </AdminPageShell>
  );
}
