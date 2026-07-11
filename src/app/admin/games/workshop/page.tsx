import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAllWorkshopsAdmin } from "@/lib/workshops/queries";
import { WorkshopEditor } from "./WorkshopEditor";

export const metadata = { title: "Workshop & Training — Admin Flouwell" };

export default async function AdminWorkshopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const items = await getAllWorkshopsAdmin();
  return (
    <AdminPageShell pageKey="workshop" title="🎓 Workshop & Training" subtitle="Etalase event Rey: workshop, kelas, training. Muncul di app sebagai banner selama event aktif. Pendaftaran & pembayaran di luar app (Google Form + WhatsApp).">
      <WorkshopEditor items={items as Parameters<typeof WorkshopEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
