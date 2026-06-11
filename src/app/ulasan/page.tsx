import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Stars } from "@/components/Stars";

export const metadata: Metadata = {
  title: "Ulasan Pengguna — Soulpace",
  description: "Apa kata pengguna tentang Soulpace, apa adanya.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/ulasan" },
};

export const revalidate = 600;

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Review = { rating: number; comment: string; handle: string; created_at: string };

async function getData(): Promise<{ cnt: number; avg: number; reviews: Review[] }> {
  try {
    const supabase = createPublicClient();
    const [{ data: stat }, { data: rev }] = await Promise.all([
      supabase.rpc("feedback_stats"),
      supabase.rpc("public_reviews", { p_limit: 100 }),
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

export default async function UlasanPage() {
  const { cnt, avg, reviews } = await getData();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Ulasan Pengguna</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-ink">
            {cnt ? avg.toFixed(1) : "—"}
          </span>
          <span className="flex flex-col">
            <Stars value={Math.round(avg)} />
            <span className="text-xs text-ink/45">dari {cnt} ulasan</span>
          </span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/40">Belum ada ulasan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-ink/45">
                  {r.handle} · {fmt(r.created_at)}
                </span>
              </div>
              {r.comment && r.comment.trim() && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{r.comment}</p>
            )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
