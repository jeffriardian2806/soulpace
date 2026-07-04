import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ScanContentEditor } from "./ScanContentEditor";

export const metadata = { title: "Scan Diri AR — Admin Flouwell" };

export default async function AdminScanDiriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase.from("scan_contents")
    .select("id, mode, content_key, emoji, title, body, sort_order, is_active")
    .order("mode").order("sort_order");

  return (
    <AdminPageShell title="🔮 Scan Diri AR — Konten" subtitle="Copy semua mode scan (persona, karakter, love, umur, masa depan, batin, ramalan). Aura diatur terpisah di menu Cek Aura AR.">
      <ScanContentEditor items={(data ?? []) as Parameters<typeof ScanContentEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
