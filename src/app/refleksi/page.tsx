import Link from "next/link";
import type { Metadata } from "next";
import { getFeatureFlagMap, PremiumBadgeInline } from "@/components/PremiumGate";

export const metadata: Metadata = {
  title: "Refleksi — Soulpace",
  description: "Tulis & baca: jurnal pribadi, surat untuk diri sendiri, dan cerita pemulihan dari orang lain.",
  robots: { index: true, follow: true },
};

const CARDS = [
  { href: "/jurnal", slug: "jurnal", emoji: "📓", title: "Jurnal Pribadi", desc: "Tulis pikiran panjang. Cuma kamu yang baca." },
  { href: "/surat", slug: "surat", emoji: "✉️", title: "Surat untuk Diri", desc: "Tulis surat ke diri kamu di masa depan. Dikirim balik nanti." },
  { href: "/cerita", slug: "cerita", emoji: "📖", title: "Cerita Pemulihan", desc: "Baca cerita perjalanan orang lain. Kamu nggak sendiri." },
];

export default async function RefleksiPage() {
  const flagMap = await getFeatureFlagMap();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">✍️ Refleksi</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">Kembali ke beranda</Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Tempat buat nulis & baca pelan-pelan. Pilih satu yang lagi cocok sama kamu hari ini.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="glass rounded-2xl p-4 transition-colors hover:bg-sky-50">
            <div className="flex items-start justify-between">
              <p className="text-3xl">{c.emoji}</p>
              <PremiumBadgeInline flagMap={flagMap} slug={c.slug} />
            </div>
            <p className="mt-2 text-base font-bold text-ink">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
