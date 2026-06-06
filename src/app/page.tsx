import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Stars } from "@/components/Stars";

export const metadata: Metadata = {
  title: "Soulpace — Ruang Curhat Anonim",
  description:
    "Soulpace adalah ruang aman untuk melampiaskan beban dan keluh kesah secara anonim, tanpa dihakimi. Kamu nggak sendirian.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Soulpace — Ruang Curhat Anonim",
    description: "Ruang aman buat melampiaskan beban, tanpa dihakimi.",
    url: "/",
    siteName: "Soulpace",
    type: "website",
  },
};

export const revalidate = 600;

type Review = { rating: number; comment: string; handle: string; created_at: string };

async function getData(): Promise<{ cnt: number; avg: number; reviews: Review[] }> {
  try {
    const supabase = createPublicClient();
    const [{ data: stat }, { data: rev }] = await Promise.all([
      supabase.rpc("feedback_stats"),
      supabase.rpc("public_reviews", { p_limit: 3 }),
    ]);
    const row = Array.isArray(stat) ? stat[0] : stat;
    return {
      cnt: Number(row?.cnt ?? 0),
      avg: Number(row?.avg_rating ?? 0),
      reviews: (rev ?? []) as Review[],
    };
  } catch {
    return { cnt: 0, avg: 0, reviews: [] };
  }
}

export default async function Home() {
  const { cnt, avg, reviews } = await getData();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-ink">Soulpace</h1>
          <p className="mt-2 text-ink/60">
            Tempat melampiaskan beban, tanpa dihakimi. Kamu nggak sendirian.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-center font-semibold text-white"
          >
            Mulai
          </Link>
          <Link
            href="/feed"
            className="glass rounded-2xl px-4 py-3 text-center font-medium text-ink"
          >
            Lihat-lihat dulu
          </Link>
          <Link href="/login" className="text-center text-sm text-ink/55">
            Sudah punya akun? Masuk
          </Link>
        </div>
      </div>

      {cnt > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Apa kata pengguna</h2>
            <Link href="/ulasan" className="text-xs font-medium text-sky-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-ink">{avg.toFixed(1)}</span>
            <span className="flex flex-col">
              <Stars value={Math.round(avg)} />
              <span className="text-xs text-ink/45">dari {cnt} ulasan</span>
            </span>
          </div>
          {reviews.map((r, i) => (
            <div key={i} className="glass rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-ink/45">{r.handle}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink/80">{r.comment}</p>
            </div>
          ))}
        </section>
      )}

      <footer className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink/40">
        <Link href="/panduan" className="hover:underline">Panduan</Link>
        <span>·</span>
        <Link href="/terms" className="hover:underline">Ketentuan Layanan</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:underline">Kebijakan Privasi</Link>
      </footer>
    </main>
  );
}
