import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivePsikologs } from "@/lib/telekonsul/queries";
import { PsikologCard } from "@/components/telekonsul/PsikologCard";

export const metadata = { title: "Telekonsul — Flouwell" };

export default async function TelekonsulLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; from_session?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/telekonsul");

  const psikologs = await getActivePsikologs();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">🩺 Telekonsul</h1>
      </header>

      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 ring-1 ring-sky-100">
        <p className="text-sm font-semibold text-ink">Konsul langsung sama psikolog</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/70">
          Chat real-time, privat, identitas lo terjaga (cuma psikolog yang liat data lo). Pilih psikolog
          di bawah → mulai sesi.
        </p>
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-100">
          🎁 Beta: chat gratis untuk semua. Voice/Video belum tersedia.
        </p>
      </div>

      {sp.err && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
          ⚠️ {sp.err}
        </div>
      )}

      {sp.from_session && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
          📋 Rekam medis konsultasi mandiri lo bakal auto-share ke psikolog yang lo pilih di bawah. Psikolog akan liat keluhan + hasil skrining tanpa perlu lo cerita ulang.
        </div>
      )}

      <Link
        href="/telekonsul/chat"
        className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-sky-200 hover:bg-sky-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">
          📥
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">Inbox sesi lo</p>
          <p className="text-[11px] text-ink/55">Liat semua sesi chat — patient atau psikolog</p>
        </div>
        <span className="text-ink/30">→</span>
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-ink/85">Psikolog tersedia</h2>
        {psikologs.length === 0 ? (
          <div className="rounded-xl bg-ink/5 p-6 text-center text-sm text-ink/50">
            Belum ada psikolog aktif. Tim Flouwell lagi onboarding.
          </div>
        ) : (
          psikologs.map((p) => <PsikologCard key={p.id} psikolog={p} fromSession={sp.from_session} />)
        )}
      </section>
    </main>
  );
}
