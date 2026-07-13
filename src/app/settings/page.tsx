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

  // Cek apakah user adalah psikolog (additive identity via row di psikologs)
  const { data: psikolog } = await supabase
    .from("psikologs")
    .select("id, slug, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // Cek apakah user pernah punya chat_thread (sebagai patient atau psikolog)
  // Buat tampil shortcut inbox Telekonsul
  const { count: threadCount } = await supabase
    .from("chat_threads")
    .select("id", { count: "exact", head: true })
    .or(`patient_id.eq.${user.id},psikolog_id.eq.${user.id}`);
  const hasThreads = (threadCount ?? 0) > 0;

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

      {/* Telekonsul shortcut — visible kalau user punya thread (patient/psikolog) atau terdaftar psikolog */}
      {(hasThreads || psikolog) && (
        <section className="glass rounded-2xl p-2">
          <h2 className="px-2 py-1 text-sm font-semibold text-ink">Telekonsul</h2>
          <Link
            href="/telekonsul/chat"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>📥 Inbox Chat Psikolog</span>
            <span className="text-ink/40">→</span>
          </Link>
          {psikolog && (
            <>
              <Link
                href={`/telekonsul/${psikolog.slug}`}
                className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
              >
                <span>👤 Profile Publik Lo (sebagai Psikolog)</span>
                <span className="text-ink/40">→</span>
              </Link>
              {!psikolog.is_active && (
                <p className="px-2 py-1 text-[11px] italic text-amber-700">
                  ⚠️ Profile lo sedang non-aktif — patient ga bisa cari/booking lo.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {((profile?.role as string) === "moderator" || (profile?.role as string) === "admin") && (
        <section className="glass rounded-2xl p-2">
          <h2 className="px-2 py-1 text-sm font-semibold text-ink">Admin</h2>
          <Link
            href="/admin/analytics"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>📊 Analytics</span>
            <span className="text-ink/40">→</span>
          </Link>
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
          <Link
            href="/admin/games"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>🎮 Game &amp; Kuis</span>
            <span className="text-ink/40">→</span>
          </Link>
          <Link
            href="/admin/playground"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>📊 Polling &amp; Ruang</span>
            <span className="text-ink/40">→</span>
          </Link>
          <Link
            href="/admin/telekonsul-blocklist"
            className="flex items-center justify-between rounded-xl px-2 py-3 text-sm text-ink/80 hover:bg-sky-50"
          >
            <span>🛡️ Anti-Leak Blocklist</span>
            <span className="text-ink/40">→</span>
          </Link>
        </section>
      )}
    </main>
  );
}
