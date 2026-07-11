import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { WellbeingContentEditor } from "./WellbeingContentEditor";

export const metadata = { title: "Wellbeing AR — Admin Flouwell" };

export default async function AdminWellbeingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase.from("wellbeing_contents")
    .select("id, kind, content_key, emoji, title, body, extra, sort_order, is_active")
    .order("kind").order("sort_order");

  return (
    <AdminPageShell pageKey="wellbeing" title="🌿 Wellbeing AR" subtitle="Konten 4 game wellbeing: pola napas, kalimat fokus, label emosi, kata affirmasi. Bebas ubah/tambah sesuai fakta lapangan.">
      <WellbeingContentEditor items={(data ?? []) as Parameters<typeof WellbeingContentEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
