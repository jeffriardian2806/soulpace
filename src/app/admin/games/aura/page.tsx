import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AuraMoodEditor } from "./AuraMoodEditor";

export const metadata = { title: "Cek Aura AR — Admin Flouwell" };

export default async function AdminAuraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase.from("aura_moods")
    .select("id, mood_key, emoji, label, color, glow, particle, desc_short, desc_mystic, sort_order, is_active")
    .order("sort_order");

  return (
    <AdminPageShell title="🔮 Cek Aura AR" subtitle="Konten mood & aura buat game AR. Edit warna, deskripsi mistis, partikel. mood_key jangan diubah (nyambung ke deteksi).">
      <AuraMoodEditor items={(data ?? []) as Parameters<typeof AuraMoodEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
