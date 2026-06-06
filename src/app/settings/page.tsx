import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfilesService } from "@/modules/profiles";
import { HandleForm } from "@/components/HandleForm";
import { updateHandleAction } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getProfilesService();
  const profile = await svc.getProfile(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">Pengaturan</h1>
      </header>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink">Nama tampilan (handle)</h2>
        <p className="mb-3 text-xs text-ink/55">
          Tetap anonim. Bisa diganti sekali setiap 30 hari.
        </p>
        <HandleForm current={profile?.handle ?? ""} action={updateHandleAction} />
      </section>

      <section className="glass rounded-2xl p-2">
        <h2 className="px-2 py-1 text-sm font-semibold text-ink">Bantuan &amp; Lainnya</h2>
        <Link
          href="/panduan"
          className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
        >
          <span>📖 Panduan &amp; FAQ</span>
          <span className="text-ink/40">→</span>
        </Link>
        <Link
          href="/masukan"
          className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
        >
          <span>⭐ Kritik &amp; Saran</span>
          <span className="text-ink/40">→</span>
        </Link>
      </section>

      {profile?.role === "moderator" && (
        <section className="glass rounded-2xl p-2">
          <h2 className="px-2 py-1 text-sm font-semibold text-ink">Admin</h2>
          <Link
            href="/moderation"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>🛡️ Moderasi</span>
            <span className="text-ink/40">→</span>
          </Link>
          <Link
            href="/admin/skrining"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>⚙️ Kelola skrining</span>
            <span className="text-ink/40">→</span>
          </Link>
          <Link
            href="/admin/masukan"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>💬 Masukan pengguna</span>
            <span className="text-ink/40">→</span>
          </Link>
        </section>
      )}
    </main>
  );
}
