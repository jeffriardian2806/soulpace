import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAllEventsAdmin, getEventCategories } from "@/lib/events/queries";
import { EventEditor } from "./EventEditor";

export const metadata = { title: "Event — Admin Flouwell" };

export default async function AdminEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [items, cats] = await Promise.all([getAllEventsAdmin(), getEventCategories(false)]);
  return (
    <AdminPageShell pageKey="event" title="🎓 Event" subtitle="Event Rey — muncul di app sebagai banner selama tayang. Pendaftaran & pembayaran di luar app.">
      <EventEditor
        items={items as Parameters<typeof EventEditor>[0]["items"]}
        categories={cats as Parameters<typeof EventEditor>[0]["categories"]}
      />
    </AdminPageShell>
  );
}
