import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConsultationSessionById, getScreeningsByCategoryId, getTipTopicsByCategoryId } from "@/lib/konsultasi/queries";

export const metadata = { title: "Sesi Konsultasi — Soulpace" };

const CATEGORY_EMOJI: Record<string, string> = {
  "keluarga": "👨‍👩‍👧",
  "pertemanan": "👥",
  "kerjaan": "💼",
  "percintaan": "❤️",
  "sekolah-kampus": "🎓",
  "mental-diri": "🧠",
  "lainnya": "🌐",
};

type Props = { params: Promise<{ id: string }> };

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getConsultationSessionById(id);
  if (!session) notFound();

  const [skrinings, tipTopics] = await Promise.all([
    getScreeningsByCategoryId(session.category_id),
    getTipTopicsByCategoryId(session.category_id),
  ]);

  const emoji = CATEGORY_EMOJI[session.category.slug] ?? "📌";
  const createdDate = new Date(session.created_at);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/konsultasi/history" className="text-sm text-ink/50">← Riwayat</Link>
        <Link href="/konsultasi" className="text-sm font-medium text-sky-700">+ Sesi baru</Link>
      </header>

      {/* Rekam medis header */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-5 ring-1 ring-sky-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            📋 Rekam Medis · {emoji} {session.category.name}
          </p>
          {session.is_shared_to_feed && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Shared to feed
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink/55">
          {createdDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {createdDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Keluhan */}
      <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">1</span>
          <p className="text-sm font-bold text-ink">Keluhan Utama</p>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{session.keluhan_text}</p>
      </section>

      {/* Pemeriksaan */}
      <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">2</span>
          <p className="text-sm font-bold text-ink">Pemeriksaan (Bahan)</p>
        </div>

        {session.pemeriksaan_results.length === 0 && (
          <p className="mt-3 text-xs italic text-ink/45">
            Belum ada pemeriksaan ke-record di sesi ini. Coba tools di bawah:
          </p>
        )}

        {/* Pemeriksaan results yang udah ke-track (V2 — for now, just show available tools) */}
        {session.pemeriksaan_results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {session.pemeriksaan_results.map((r, i) => (
              <div key={i} className="rounded-xl bg-sky-50 p-2 text-xs text-ink/75 ring-1 ring-sky-100">
                {r.type === "screening" && (
                  <>📋 Skrining <b>{r.slug.toUpperCase()}</b> — Score: <b>{r.score}</b> · {r.band_label}</>
                )}
                {r.type === "mood" && (
                  <>😊 Mood: <b>{r.value}/5</b> {r.note ? `· ${r.note}` : ""}</>
                )}
                {r.type === "journal" && (
                  <>✍️ Jurnal entry tersimpan</>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs font-semibold text-ink/60">Available tools:</p>
        <div className="mt-2 flex flex-col gap-2">
          {skrinings.map((s) => (
            <Link
              key={s.id}
              href={`/skrining/${s.slug}?topik=${session.category.slug}&consult_id=${session.id}`}
              className="rounded-xl bg-white p-3 text-xs ring-1 ring-ink/10 hover:bg-sky-50"
            >
              🩺 {s.name} · {s.subtitle}
            </Link>
          ))}
          <Link href={`/mood?topik=${session.category.slug}`} className="rounded-xl bg-white p-3 text-xs ring-1 ring-ink/10 hover:bg-sky-50">
            😊 Catat Mood (kategori {session.category.name})
          </Link>
          <Link href={`/jurnal/baru?topik=${session.category.slug}`} className="rounded-xl bg-white p-3 text-xs ring-1 ring-ink/10 hover:bg-sky-50">
            ✍️ Tulis Jurnal (kategori {session.category.name})
          </Link>
        </div>
      </section>

      {/* Saran */}
      <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">3</span>
          <p className="text-sm font-bold text-ink">Saran</p>
        </div>

        {tipTopics.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold text-ink/60">📚 Bahan bacaan relevan:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tipTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/edukasi/${t.slug}`}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100"
                >
                  {t.emoji ?? "📖"} {t.title}
                </Link>
              ))}
            </div>
          </>
        )}

        <p className="mt-4 text-xs font-semibold text-ink/60">📞 Konsultasi lebih lanjut:</p>
        <div className="mt-2 flex flex-col gap-2">
          <Link href={`/feed?kategori=${session.category.slug}`} className="rounded-xl bg-sky-50 p-3 text-xs ring-1 ring-sky-100">
            📖 Baca cerita user lain di kategori {session.category.name} →
          </Link>
          <Link href="/safety-plan" className="rounded-xl bg-rose-50 p-3 text-xs ring-1 ring-rose-100">
            🆘 Buka Safety Plan (kalau ada abuse signal / urgent) →
          </Link>
        </div>
      </section>

      <div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
        💡 Rekam medis ini privat — cuma lo yang lihat. {session.is_shared_to_feed && "Lo udah pilih share keluhan ke feed (anonim)."}
        Sesi ini bakal jadi context kalau lo butuh konsul lanjut sama psikolog di masa depan.
      </div>
    </main>
  );
}
