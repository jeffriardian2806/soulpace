import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScreeningTool } from "@/components/ScreeningTool";
import type { ScreeningInstrument } from "@/config/screening";
import { checkPremiumAccess, getFeatureFlagMap } from "@/components/PremiumGate";

type DbItem = { position: number; text: string; reverse: boolean };
type DbOption = { label: string; value: number; sort_order: number };
type DbBand = { min_score: number; max_score: number; label: string; advice: string };
type DbInstrument = {
  slug: string;
  name: string;
  subtitle: string;
  prompt: string;
  crisis_item_position: number | null;
  screening_items: DbItem[];
  screening_options: DbOption[];
  screening_bands: DbBand[];
};

function mapInstrument(d: DbInstrument): ScreeningInstrument {
  return {
    id: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    prompt: d.prompt,
    options: [...d.screening_options]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ label: o.label, value: o.value })),
    items: [...d.screening_items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ text: i.text, reverse: i.reverse })),
    bands: [...d.screening_bands]
      .sort((a, b) => a.min_score - b.min_score)
      .map((b) => ({ min: b.min_score, max: b.max_score, label: b.label, advice: b.advice })),
    crisisItemIndex:
      d.crisis_item_position != null ? d.crisis_item_position - 1 : undefined,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("screening_instruments")
    .select("name, subtitle")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!data) return { title: "Skrining — Soulpace" };
  return {
    title: `${data.name} — Soulpace`,
    description: data.subtitle,
    robots: { index: true, follow: true },
  };
}

export default async function SkriningInstrumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flow?: string }>;
}) {
  const { slug } = await params;
  const { flow } = await searchParams;
  const _blocked_ = await checkPremiumAccess(`screening_${slug}`);
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("screening_instruments")
    .select(
      "slug, name, subtitle, prompt, crisis_item_position, category, screening_items(position, text, reverse), screening_options(label, value, sort_order), screening_bands(min_score, max_score, label, advice)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) notFound();

  const instrument = mapInstrument(data as DbInstrument);
  const flagMap = await getFeatureFlagMap();
  const timerSeconds = flagMap.get(`screening_${slug}`)?.timer_seconds ?? null;

  // === MHCU guided flow ===
  // Kalau `?flow=mhcu`, hitung next step (instrumen MHCU berikutnya yang user belum complete dalam 30 hari)
  // setelah submit, ScreeningTool akan auto-redirect ke next step (atau ke /laporan/mhcu kalau ini terakhir)
  let flowMode = false;
  let nextHref: string | undefined;
  let flowStepLabel: string | undefined;
  let flowProgressInfo: { current: number; total: number } | null = null;

  if (flow === "mhcu" && (data as { category?: string }).category === "mhcu") {
    flowMode = true;

    // Fetch list MHCU instruments urutan
    const { data: mhcuRows } = await supabase
      .from("screening_instruments")
      .select("slug, name, sort_order")
      .eq("category", "mhcu")
      .eq("is_active", true)
      .order("sort_order");
    const mhcuList = (mhcuRows ?? []) as { slug: string; name: string; sort_order: number }[];

    // Fetch user's completed MHCU dalam 30 hari
    const { data: { user } } = await supabase.auth.getUser();
    const completed = new Set<string>();
    if (user) {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const slugs = mhcuList.map((m) => `screening_${m.slug}`);
      if (slugs.length > 0) {
        const { data: doneRows } = await supabase
          .from("user_game_results")
          .select("game_key")
          .eq("user_id", user.id)
          .in("game_key", slugs)
          .gte("created_at", cutoff);
        ((doneRows ?? []) as { game_key: string }[]).forEach((r) => {
          completed.add(r.game_key.replace("screening_", ""));
        });
      }
    }

    // Cari index step saat ini
    const currentIdx = mhcuList.findIndex((m) => m.slug === slug);
    flowProgressInfo = { current: currentIdx + 1, total: mhcuList.length };
    flowStepLabel = `Tahap ${currentIdx + 1} selesai`;

    // Cari next step: yang belum complete (excluding current — anggap current akan complete setelah submit)
    const futureCompleted = new Set(completed);
    futureCompleted.add(slug);
    const nextStep = mhcuList.find((m, i) => i > currentIdx && !futureCompleted.has(m.slug))
                  ?? mhcuList.find((m) => !futureCompleted.has(m.slug));

    if (nextStep) {
      nextHref = `/skrining/${nextStep.slug}?flow=mhcu`;
    } else {
      // Semua tahap selesai → ke laporan komprehensif
      nextHref = "/laporan/mhcu";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        {!flowMode && (
          <Link href="/skrining" className="text-sm text-ink/50">← Kembali</Link>
        )}
        <h1 className="text-xl font-bold text-ink">
          {flowMode ? "🌱" : "📋"} {instrument.name}
        </h1>
      </header>
      {flowMode && flowProgressInfo && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200">
          <p className="text-xs font-semibold text-emerald-700">
            MHCU · Tahap {flowProgressInfo.current} dari {flowProgressInfo.total}
          </p>
          <p className="mt-0.5 text-[10px] text-ink/55">
            Progress auto-saved. Hasil cuma muncul setelah 6/6 tahap selesai — kalau pause, tinggal balik lagi nanti dari tahap yang belum kelar.
          </p>
        </div>
      )}
      <p className="text-sm leading-relaxed text-ink/60">
        {instrument.subtitle}. Jawab apa adanya. Hasilnya cuma buat kamu sendiri.
      </p>
      <ScreeningTool
        instruments={[instrument]}
        flowMode={flowMode}
        nextHref={nextHref}
        flowStepLabel={flowStepLabel}
        timerSeconds={timerSeconds}
      />
    </main>
  );
}
