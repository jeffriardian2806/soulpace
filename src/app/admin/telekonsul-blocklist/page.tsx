import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlocklistEditor } from "./BlocklistEditor";

export const metadata = { title: "Anti-Leak Blocklist — Admin Flouwell" };

export default async function BlocklistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: rows } = await supabase
    .from("leak_blocklist")
    .select("id, pattern, match_type, label, category, is_active")
    .order("category")
    .order("pattern");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/settings" className="text-sm font-medium text-sky-600 hover:underline">
          ← Pengaturan
        </Link>
      </header>
      <h1 className="text-xl font-bold text-ink">🛡️ Anti-Leak Blocklist (Telekonsul)</h1>
      <p className="text-sm leading-relaxed text-ink/60">
        Kata/pola yang diblokir di chat psikolog biar pasien & psikolog gak tukeran kontak off-platform.
        Daftar bawaan (hardcode) tetap aktif walau tabel ini kosong — ini lapisan tambahan yang bisa lo atur sendiri.
      </p>
      <BlocklistEditor items={(rows ?? []) as Parameters<typeof BlocklistEditor>[0]["items"]} />
    </main>
  );
}
