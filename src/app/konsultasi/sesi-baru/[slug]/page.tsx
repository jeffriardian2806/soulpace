import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCategoryBySlug,
  getScreeningsByCategoryId,
  getTipTopicsByCategoryId,
  getStoriesByCategoryId,
} from "@/lib/konsultasi/queries";
import { KeluhanForm } from "@/components/konsultasi/KeluhanForm";

export const metadata = { title: "Sesi Baru — Konsultasi Soulpace" };

const CATEGORY_EMOJI: Record<string, string> = {
  "keluarga": "👨‍👩‍👧",
  "pertemanan": "👥",
  "kerjaan": "💼",
  "percintaan": "❤️",
  "sekolah-kampus": "🎓",
  "mental-diri": "🧠",
  "lainnya": "🌐",
};

type Props = { params: Promise<{ slug: string }> };

export default async function SesiBaruPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/konsultasi/sesi-baru/${slug}`);

  const kategori = await getCategoryBySlug(slug);
  if (!kategori) notFound();

  const [skrinings, tipTopics, stories] = await Promise.all([
    getScreeningsByCategoryId(kategori.id),
    getTipTopicsByCategoryId(kategori.id),
    getStoriesByCategoryId(kategori.id, 3),
  ]);

  const emoji = CATEGORY_EMOJI[kategori.slug] ?? "📌";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/konsultasi" className="text-sm text-ink/50">← Kategori</Link>
      </header>

      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-5 ring-1 ring-sky-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          🩺 Konsultasi · {emoji} {kategori.name}
        </p>
        <h1 className="mt-1 text-xl font-bold text-ink">Ceritain dulu — apa yang lagi terjadi?</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Tulis keluhan utama lo. Lebih detail lebih baik — biar nanti kalau lo butuh konsul lanjut
          sama psikolog, mereka udah ada context.
        </p>
      </div>

      {/* STEP 1: KELUHAN form */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">1</span>
          <p className="text-sm font-bold text-ink">Keluhan Utama</p>
        </div>
        <KeluhanForm categorySlug={kategori.slug} categoryName={kategori.name} />
      </section>

      {/* STEP 2: PEMERIKSAAN preview */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">2</span>
          <p className="text-sm font-bold text-ink">Pemeriksaan (Bahan)</p>
        </div>
        <p className="mb-3 text-xs text-ink/55">
          Tools yang bisa lo pake buat identify pola di kategori ini. Bisa lo coba sekarang atau
          nanti setelah simpan keluhan.
        </p>

        <div className="flex flex-col gap-2">
          {skrinings.length > 0 ? (
            skrinings.map((s) => (
              <Link
                key={s.id}
                href={`/skrining/${s.slug}?topik=${kategori.slug}`}
                className="rounded-xl bg-white p-3 ring-1 ring-ink/10 hover:bg-sky-50"
              >
                <p className="text-sm font-bold text-ink">🩺 {s.name}</p>
                <p className="mt-0.5 text-xs text-ink/55">
                  {s.subtitle} · {s.item_count} pertanyaan
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl bg-ink/5 p-3 text-xs text-ink/50">
              Belum ada skrining khusus kategori ini. Tim psikolog kami lagi prepare.
            </div>
          )}

          <Link
            href={`/mood?topik=${kategori.slug}`}
            className="rounded-xl bg-white p-3 ring-1 ring-ink/10 hover:bg-sky-50"
          >
            <p className="text-sm font-bold text-ink">😊 Catat Mood</p>
            <p className="mt-0.5 text-xs text-ink/55">Log perasaan saat ngalamin situasi ini</p>
          </Link>

          <Link
            href={`/jurnal/baru?topik=${kategori.slug}`}
            className="rounded-xl bg-white p-3 ring-1 ring-ink/10 hover:bg-sky-50"
          >
            <p className="text-sm font-bold text-ink">✍️ Tulis Jurnal</p>
            <p className="mt-0.5 text-xs text-ink/55">Tulis kejadian lebih detail</p>
          </Link>
        </div>
      </section>

      {/* STEP 3: SARAN preview */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">3</span>
          <p className="text-sm font-bold text-ink">Saran (Bahan Bacaan + Peer Support)</p>
        </div>

        {tipTopics.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold text-ink/60">📚 Topik tips edukasi yang relevan:</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {tipTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/edukasi/${t.slug}`}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
                >
                  {t.emoji ?? "📖"} {t.title}
                </Link>
              ))}
            </div>
          </>
        )}

        {stories.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold text-ink/60">📖 Cerita user lain (peer learning):</p>
            <div className="mb-3 flex flex-col gap-2">
              {stories.map((s) => (
                <div key={s.id} className="rounded-xl bg-white p-3 ring-1 ring-ink/10">
                  <p className="line-clamp-2 text-xs leading-relaxed text-ink/70">{s.body}</p>
                  <p className="mt-1 text-[10px] text-ink/40">
                    {new Date(s.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
              <Link
                href={`/feed?kategori=${kategori.slug}`}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Liat semua cerita {kategori.name.toLowerCase()} →
              </Link>
            </div>
          </>
        )}

        <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100">
          <p className="text-xs font-semibold text-rose-900">🆘 Kalau urgent (abuse signal, suicidal):</p>
          <Link href="/crisis-mode" className="mt-1 inline-block text-xs font-bold text-rose-700 underline">
            Buka SAYA DI SINI / Crisis Mode →
          </Link>
        </div>
      </section>
    </main>
  );
}
