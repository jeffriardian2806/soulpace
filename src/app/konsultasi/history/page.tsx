import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserConsultationSessions } from "@/lib/konsultasi/queries";

export const metadata = { title: "Riwayat Konsultasi — Soulpace" };

const CATEGORY_EMOJI: Record<string, string> = {
  "keluarga": "👨‍👩‍👧",
  "pertemanan": "👥",
  "kerjaan": "💼",
  "percintaan": "❤️",
  "sekolah-kampus": "🎓",
  "mental-diri": "🧠",
  "lainnya": "🌐",
};

export default async function KonsultasiHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/konsultasi/history");

  const sessions = await getUserConsultationSessions(50);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/konsultasi" className="text-sm text-ink/50">← Kembali</Link>
        <Link href="/konsultasi" className="text-sm font-medium text-sky-700">+ Sesi baru</Link>
      </header>

      <h1 className="text-xl font-bold text-ink">📋 Riwayat Konsultasi</h1>
      <p className="text-sm text-ink/60">
        Semua sesi konsultasi lo. Privat — cuma lo yang lihat. Kalau ada yang shared ke feed, ada
        tanda khusus.
      </p>

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-sky-50 p-6 text-center ring-1 ring-sky-100">
          <p className="text-sm text-ink/70">Belum ada sesi konsultasi.</p>
          <Link href="/konsultasi" className="mt-3 inline-block rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white">
            Mulai sesi pertama →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => {
            const date = new Date(s.created_at);
            const cat_slug = Object.entries(CATEGORY_EMOJI).find(([slug]) => s.category_name.toLowerCase().includes(slug.split("-")[0]))?.[0];
            const emoji = cat_slug ? CATEGORY_EMOJI[cat_slug] : "📌";
            return (
              <Link
                key={s.id}
                href={`/konsultasi/${s.id}`}
                className="rounded-2xl bg-white p-4 ring-1 ring-ink/10 hover:bg-sky-50/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-ink">{s.category_name}</p>
                      <p className="text-[10px] text-ink/45">
                        {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  {s.is_shared_to_feed && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
                      📤 Feed
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/65">{s.keluhan_text}</p>
                {s.pemeriksaan_results.length > 0 && (
                  <p className="mt-1 text-[10px] text-ink/45">
                    {s.pemeriksaan_results.length} pemeriksaan ke-track
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
