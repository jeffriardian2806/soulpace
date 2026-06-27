import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MhcuComprehensiveReport } from "@/components/laporan/MhcuComprehensiveReport";

export const metadata: Metadata = {
  title: "Laporan MHCU Komprehensif — Flouwell",
  robots: { index: false, follow: false },
};

type RawResult = {
  game_key: string;
  summary: { headline: string; value?: string };
  detail: { score?: number; max?: number; band_label?: string; severity?: string } | null;
  created_at: string;
};

export default async function LaporanMhcuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/laporan/mhcu");

  // Fetch list MHCU instruments
  const { data: instruments } = await supabase
    .from("screening_instruments")
    .select("slug, name, subtitle, sort_order, screening_bands(min_score, max_score, label)")
    .eq("category", "mhcu")
    .eq("is_active", true)
    .order("sort_order");

  const mhcuList = (instruments ?? []) as { slug: string; name: string; subtitle: string; sort_order: number; screening_bands: { min_score: number; max_score: number; label: string }[] }[];

  // Fetch latest hasil per MHCU instrument dalam 30 hari
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const slugs = mhcuList.map((m) => `screening_${m.slug}`);
  const { data: rows } = slugs.length > 0
    ? await supabase
        .from("user_game_results")
        .select("game_key, summary, detail, created_at")
        .eq("user_id", user.id)
        .in("game_key", slugs)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Dedupe — ambil latest per game_key
  const latestByKey = new Map<string, RawResult>();
  ((rows ?? []) as RawResult[]).forEach((r) => {
    if (!latestByKey.has(r.game_key)) latestByKey.set(r.game_key, r);
  });

  // Build hasil per instrument
  type DimensionResult = {
    slug: string;
    name: string;
    completed: boolean;
    headline?: string;
    score?: number;
    max?: number;
    severity?: string;
    band_label?: string;
    created_at?: string;
    bands: { min_score: number; max_score: number; label: string }[];
  };
  const dimensions: DimensionResult[] = mhcuList.map((m) => {
    const r = latestByKey.get(`screening_${m.slug}`);
    const bands = (m.screening_bands ?? []).slice().sort((a, b) => a.min_score - b.min_score);
    if (!r) return { slug: m.slug, name: m.name, completed: false, bands };
    return {
      slug: m.slug,
      name: m.name,
      completed: true,
      headline: r.summary.headline,
      score: r.detail?.score,
      max: r.detail?.max,
      severity: r.detail?.severity,
      band_label: r.detail?.band_label,
      created_at: r.created_at,
      bands,
    };
  });

  const completedCount = dimensions.filter((d) => d.completed).length;

  // Kalau belum complete semua, kasih notice
  if (completedCount < dimensions.length) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <header className="flex items-center gap-3">
          <Link href="/skrining" className="text-sm text-ink/50">← Skrining</Link>
          <h1 className="text-xl font-bold text-ink">🌱 Laporan MHCU</h1>
        </header>
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">⏳</p>
          <p className="mt-2 text-base font-bold text-ink">Laporan komprehensif belum bisa dibuat</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Selesain semua {dimensions.length} tahap MHCU dulu biar bisa dilihat pola lintas-dimensi. Sekarang baru <strong>{completedCount} dari {dimensions.length}</strong> tahap.
          </p>
          <Link href="/skrining" className="mt-3 inline-block rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
            Lanjutin tahap berikutnya →
          </Link>
        </div>

        <section className="glass rounded-2xl p-4">
          <p className="text-sm font-bold text-ink">Status tahap kamu:</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {dimensions.map((d, i) => (
              <li key={d.slug} className="flex items-center gap-2 text-xs">
                <span className={d.completed ? "text-emerald-500" : "text-ink/30"}>
                  {d.completed ? "✓" : "○"}
                </span>
                <span className={d.completed ? "text-ink" : "text-ink/55"}>
                  Tahap {i + 1}: {d.name}
                  {d.completed && d.band_label && <span className="ml-1 italic text-ink/55">({d.band_label})</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  // Complete semua — render comprehensive report
  return <MhcuComprehensiveReport dimensions={dimensions as Required<DimensionResult>[]} />;
}
