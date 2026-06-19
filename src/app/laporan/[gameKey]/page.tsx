import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MirrorLaporan } from "@/components/laporan/MirrorLaporan";
import { SpektrumLaporan } from "@/components/laporan/SpektrumLaporan";
import { KompasLaporan } from "@/components/laporan/KompasLaporan";
import { ScreeningLaporan } from "@/components/laporan/ScreeningLaporan";

export async function generateMetadata({ params }: { params: Promise<{ gameKey: string }> }): Promise<Metadata> {
  const { gameKey } = await params;
  return { title: `Laporan ${gameKey} — Soulpace`, robots: { index: false, follow: false } };
}

type ResultRow = {
  summary: { headline: string; value?: string; emoji?: string; secondary?: string; title?: string };
  detail: Record<string, unknown> | null;
  created_at: string;
};

export default async function LaporanPage({ params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/laporan/${gameKey}`);

  // Ambil hasil terbaru user buat game_key ini
  const { data: resultRow } = await supabase
    .from("user_game_results")
    .select("summary, detail, created_at")
    .eq("user_id", user.id)
    .eq("game_key", gameKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!resultRow) {
    // Belum pernah ambil tes ini — kasih friendly empty state
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <header className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-ink/50">← Profil</Link>
          <h1 className="text-base font-bold text-ink">📄 Laporan</h1>
        </header>
        <div className="rounded-2xl bg-sky-50/50 p-6 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-sm text-ink/65">Kamu belum pernah ambil tes ini. Coba dulu, baru laporannya bisa keluar di sini.</p>
          <Link href="/skrining" className="mt-3 inline-block rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white">
            Lihat semua tes & skrining →
          </Link>
        </div>
      </main>
    );
  }

  const result = resultRow as ResultRow;

  // === Dispatch per game_key ===

  if (gameKey === "mirror") {
    const { data: profiles } = await supabase
      .from("mirror_profiles")
      .select("slug, name, emoji, description, insight")
      .eq("is_active", true);
    return <MirrorLaporan
      result={result as { summary: { headline: string; value?: string; emoji?: string }; detail: { profile_slug?: string; picks?: string[] } | null; created_at: string }}
      profiles={(profiles ?? []) as { slug: string; name: string; emoji: string; description: string; insight: string }[]}
    />;
  }

  if (gameKey === "spektrum") {
    const { data: categories } = await supabase
      .from("personality_categories")
      .select("id, slug, name, emoji, description")
      .eq("is_active", true)
      .order("sort_order");
    return <SpektrumLaporan
      result={result as { summary: { headline: string; value?: string }; detail: { intro?: number; extro?: number; by_category?: Record<string, { intro: number; extro: number }> } | null; created_at: string }}
      categories={(categories ?? []) as { id: string; slug: string; name: string; emoji: string; description: string }[]}
    />;
  }

  if (gameKey === "kompas") {
    const [{ data: types }, { data: majors }] = await Promise.all([
      supabase.from("compass_types").select("letter, name, tagline, description, traits").eq("is_active", true).order("sort_order"),
      supabase.from("compass_majors").select("id, name, description, primary_letters, careers").eq("is_active", true).order("sort_order"),
    ]);
    return <KompasLaporan
      result={result as { summary: { headline: string; value?: string }; detail: { holland_code?: string; totals?: Record<string, number>; top3?: { letter: string; score: number }[] } | null; created_at: string }}
      types={(types ?? []) as { letter: string; name: string; tagline: string; description: string; traits: string }[]}
      majors={(majors ?? []) as { id: string; name: string; description: string; primary_letters: string[]; careers: string[] }[]}
    />;
  }

  if (gameKey.startsWith("screening_")) {
    const slug = gameKey.replace("screening_", "");
    const { data: instrument } = await supabase
      .from("screening_instruments")
      .select("slug, name, subtitle, category, screening_bands(min_score, max_score, label, advice)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!instrument) notFound();

    // === MHCU guard: per-test laporan cuma boleh diakses kalau 6/6 MHCU komplet dalam 30 hari ===
    if (instrument.category === "mhcu") {
      const { data: mhcuList } = await supabase
        .from("screening_instruments")
        .select("slug")
        .eq("category", "mhcu")
        .eq("is_active", true);
      const mhcuSlugs = (mhcuList ?? []).map((m: { slug: string }) => `screening_${m.slug}`);
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data: doneRows } = await supabase
        .from("user_game_results")
        .select("game_key")
        .eq("user_id", user.id)
        .in("game_key", mhcuSlugs)
        .gte("created_at", cutoff);
      const completedSet = new Set((doneRows ?? []).map((r: { game_key: string }) => r.game_key));
      const allComplete = mhcuSlugs.every((s) => completedSet.has(s));

      if (!allComplete) {
        // Block individual access — kasih notice di redirect ke /skrining
        return (
          <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
            <header className="flex items-center gap-3">
              <Link href="/skrining" className="text-sm text-ink/50">← Skrining</Link>
              <h1 className="text-base font-bold text-ink">🔒 Laporan terkunci</h1>
            </header>
            <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 text-base font-bold text-ink">Laporan MHCU per-tahap belum bisa dilihat</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">
                MHCU itu paket komprehensif — kayak MCU di rumah sakit, hasil tiap tahap saling berhubungan. Laporan per-tahap cuma kebuka setelah <strong>{mhcuSlugs.length} tahap selesai semua</strong>. Progress sekarang: <strong>{completedSet.size} / {mhcuSlugs.length}</strong>.
              </p>
              <Link href="/skrining" className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
                Lanjut tahap berikutnya →
              </Link>
            </div>
          </main>
        );
      }
      // 6/6 komplet → lanjut render normal (drill-down dari /laporan/mhcu OK)
    }

    // Sort bands by min_score
    const bands = [...(instrument.screening_bands ?? [])].sort((a, b) => a.min_score - b.min_score);
    return <ScreeningLaporan
      result={result as { summary: { headline: string; value?: string }; detail: { score?: number; max?: number; band_label?: string; band_advice?: string; crisis?: boolean; severity?: string } | null; created_at: string }}
      instrument={{
        slug: instrument.slug,
        name: instrument.name,
        subtitle: instrument.subtitle,
        category: instrument.category as "clinical" | "mhcu" | "other",
        screening_bands: bands,
      }}
    />;
  }

  // Game lain (quiz legacy, dll) — fallback ke generic display
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-ink/50">← Profil</Link>
        <h1 className="text-base font-bold text-ink">📄 {result.summary.title ?? gameKey}</h1>
      </header>
      <div className="rounded-3xl bg-gradient-to-br from-sky-400 to-purple-500 p-6 text-white">
        <p className="text-5xl">{result.summary.emoji ?? "✨"}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-white/70">{result.summary.title ?? "Hasil"}</p>
        <p className="mt-1 text-2xl font-bold">{result.summary.headline}</p>
        {result.summary.value && <p className="mt-2 text-sm text-white/90">{result.summary.value}</p>}
      </div>
      <p className="text-xs text-ink/55">Laporan rinci untuk game ini belum tersedia.</p>
      <Link href="/profile" className="self-start rounded-full bg-white/70 px-5 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-100">
        Kembali ke profil
      </Link>
    </main>
  );
}
