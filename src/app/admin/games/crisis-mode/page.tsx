import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CrisisMessagesEditor } from "@/components/admin/CrisisMessagesEditor";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = { title: "Crisis Mode Messages — Admin Soulpace" };

export default async function AdminCrisisMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data } = await supabase
    .from("crisis_mode_messages")
    .select("id, slot, text, sort_order, is_active")
    .order("slot")
    .order("sort_order");

  return (
    <AdminPageShell
      title="🛟 Crisis Mode Messages"
      subtitle="Edit text yang muncul + dibacakan TTS di Crisis Companion. Tone: gentle, validating, no clinical advice. Kalau kosong, fallback ke hardcoded default."
    >
      <CrisisMessagesEditor items={(data ?? []) as Parameters<typeof CrisisMessagesEditor>[0]["items"]} />
    </AdminPageShell>
  );
}
