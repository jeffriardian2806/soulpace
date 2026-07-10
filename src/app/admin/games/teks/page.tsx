import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { UiTextEditor } from "./UiTextEditor";

export const metadata = { title: "Teks Halaman Admin — Flouwell" };

export default async function AdminUiTextPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase.from("ui_texts").select("key, value").order("key");

  return (
    <AdminPageShell title="✏️ Teks Halaman Admin" subtitle="Edit judul & penjelasan tiap halaman admin biar bahasanya lebih gampang dipahami — tanpa perlu ubah code.">
      <UiTextEditor items={(data ?? []) as { key: string; value: string }[]} />
    </AdminPageShell>
  );
}
