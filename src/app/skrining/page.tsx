import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tes & Skrining — Soulpace",
  description:
    "Tes kepribadian (Spektrum, Kompas), Mental Health Check-Up (Burnout, Self-Esteem, dll), dan skrining klinis (PHQ-9, GAD-7).",
  robots: { index: true, follow: true },
};

const PERSONALITY_TESTS = [
  {
    href: "/main/spektrum",
    emoji: "🌗",
    title: "Spektrum Sosial",
    desc: "Introvert vs extrovert — 24 pertanyaan dari 6 kategori. Dapet persentase + breakdown per kategori.",
    badge: "Big Five",
  },
  {
    href: "/main/kompas",
    emoji: "🧭",
    title: "Kompas Jurusan",
    desc: "Buat anak SMA yang bingung mau kuliah jurusan apa. Holland Code + rekomendasi jurusan + contoh karir.",
    badge: "RIASEC",
  },
];

type ScreeningCard = { slug: string; name: string; subtitle: string; category: "clinical" | "mhcu" | "other" };

export default async function SkriningPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("screening_instruments")
    .select("slug, name, subtitle, category")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const all = (data ?? []) as ScreeningCard[];
  const mhcuList = all.filter((x) => x.category === "mhcu");
  const clinicalList = all.filter((x) => x.category === "clinical");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Tes &amp; Skrining</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Eksplorasi diri lewat tes interaktif + cek gejala dengan instrumen klinis. Semuanya ada ilmu psikologinya, hasilnya cuma buat kamu sendiri.
      </p>

      {/* === Section 1: Tes Kepribadian & Karir (non-clinical, gamified) === */}
      <section>
        <h2 className="mb-1 text-base font-bold text-ink">🎓 Tes Kepribadian &amp; Karir</h2>
        <p className="mb-3 text-xs text-ink/55">
          Tes psikologi interaktif buat kenalan sama diri sendiri. Bukan diagnosis — alat refleksi & eksplorasi.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PERSONALITY_TESTS.map((t) => (
            <Link key={t.href} href={t.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
              <div className="flex items-start justify-between">
                <p className="text-2xl">{t.emoji}</p>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{t.badge}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">{t.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* === Section 2: Mental Health Check-Up (preventive, non-clinical) === */}
      <section className="mt-2">
        <h2 className="mb-1 text-base font-bold text-ink">🌱 Mental Health Check-Up (MHCU)</h2>
        <p className="mb-3 text-xs text-ink/55">
          Cek pelan-pelan area kesejahteraan psikologis kamu. Bukan diagnosis — alat refleksi preventif yang complementary sama skrining klinis di bawah.
        </p>
        {mhcuList.length === 0 ? (
          <p className="rounded-2xl bg-sky-50/50 p-4 text-center text-sm text-ink/60">
            Belum ada instrumen MHCU aktif.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {mhcuList.map((c) => (
              <Link key={c.slug} href={`/skrining/${c.slug}`} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
                <div className="flex items-start justify-between">
                  <p className="text-2xl">🌱</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">MHCU</span>
                </div>
                <p className="mt-1 text-sm font-bold text-ink">{c.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{c.subtitle}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* === Section 3: Skrining Klinis (clinical detection) === */}
      <section className="mt-2">
        <h2 className="mb-1 text-base font-bold text-ink">📋 Skrining Klinis</h2>
        <p className="mb-3 text-xs text-ink/55">
          Instrumen yang dipakai psikolog/psikiater buat mengenali gejala. Bukan diagnosis — alat bantu awal.
        </p>
        {clinicalList.length === 0 ? (
          <p className="rounded-2xl bg-sky-50/50 p-4 text-center text-sm text-ink/60">
            Belum ada instrumen klinis aktif.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clinicalList.map((c) => (
              <Link key={c.slug} href={`/skrining/${c.slug}`} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
                <div className="flex items-start justify-between">
                  <p className="text-2xl">📋</p>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">Klinis</span>
                </div>
                <p className="mt-1 text-sm font-bold text-ink">{c.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{c.subtitle}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
