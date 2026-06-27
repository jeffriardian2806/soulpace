import Link from "next/link";
import type { Metadata } from "next";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edukasi & Tips Kesehatan Mental — Flouwell",
  description:
    "Tips actionable per kondisi: overthinking, susah tidur, cemas, marah, sedih, burnout, dll. Plus definisi tiap kondisi dari sudut psikologi.",
  robots: { index: true, follow: true },
};

type Topic = { slug: string; title: string; emoji: string | null; definition: string | null; sort_order: number };

export default async function EdukasiPage() {
  const _blocked_ = await checkPremiumAccess("edukasi");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tip_topics")
    .select("slug, title, emoji, definition, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  const topics = (data ?? []) as Topic[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">📚 Edukasi & Tips</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">← Beranda</Link>
      </header>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-relaxed text-ink/70">
        Tips di sini buat bantu sehari-hari, <strong>bukan pengganti</strong> bantuan profesional. Kalau perasaan berat &gt;2 minggu atau ada pikiran nyakitin diri, hubungi{" "}
        <span className="font-semibold text-ink/85">{CRISIS_RESOURCE.phone}</span> (SEJIWA, gratis 24 jam) atau{" "}
        <a href={CRISIS_RESOURCE.url} target="_blank" rel="nofollow noopener noreferrer" className="font-medium text-sky-600 underline">healing119.id</a>.
      </div>

      <p className="text-sm text-ink/65">Pilih topik buat baca tips lengkap-nya:</p>

      {topics.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-base font-bold text-ink">Konten belum siap</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Admin perlu run migration <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">0039</code> & <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">0040</code> dulu.
          </p>
        </div>
      ) : (
        <section className="grid gap-2 sm:grid-cols-2">
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/edukasi/${t.slug}`}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/8 transition-all hover:ring-sky-300 hover:bg-sky-50 active:scale-[0.99]"
            >
              <span className="text-3xl shrink-0">{t.emoji ?? "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{t.title}</p>
                {t.definition && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60 line-clamp-2">
                    {t.definition.length > 100 ? t.definition.slice(0, 100) + "..." : t.definition}
                  </p>
                )}
              </div>
              <span className="text-sky-600 shrink-0">→</span>
            </Link>
          ))}
        </section>
      )}

      <Link href="/video" className="glass mt-2 flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100">
        <span className="text-sm font-medium text-ink">
          🎬 Video Edukasi
          <span className="block text-xs font-normal text-ink/55">Tonton dari psikolog & psikiater berlisensi</span>
        </span>
        <span className="text-sky-600">→</span>
      </Link>

      <Link href="/skrining" className="glass mt-2 flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100">
        <span className="text-sm font-medium text-ink">
          Coba skrining kesehatan mental
          <span className="block text-xs font-normal text-ink/55">PHQ-9, GAD-7, OCI-R, MDQ, PTSD</span>
        </span>
        <span className="text-sky-600">→</span>
      </Link>

      <p className="pb-4 text-center text-xs text-ink/40">
        Sumber: pendekatan umum CBT, DBT, &amp; mindfulness research. Sesuaikan kondisi, konsultasi profesional bila perlu.
      </p>
    </main>
  );
}
