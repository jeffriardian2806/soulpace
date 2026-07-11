import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getEventCategories } from "@/lib/events/queries";
import { EventCategoryEditor } from "./EventCategoryEditor";

export const metadata = { title: "Kategori Event — Admin Flouwell" };

export default async function AdminEventCategoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const cats = await getEventCategories(false);
  return (
    <AdminPageShell pageKey="event-category" title="🏷️ Kategori Event" subtitle="Kategori pilihan buat event (Workshop/Training/Pelatihan/dll). Yang lo isi di sini bakal muncul di dropdown saat bikin event & jadi label di banner publik.">
      <EventCategoryEditor items={cats as Parameters<typeof EventCategoryEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
