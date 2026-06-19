import Link from "next/link";

type ScreeningCard = { slug: string; name: string; subtitle: string; category: "clinical" | "mhcu" | "other" };

export function MhcuActionList({
  items,
  flagMap,
  completedSet,
  latestResults,
}: {
  items: ScreeningCard[];
  flagMap: Map<string, { is_premium: boolean; token_cost: number }>;
  completedSet: Set<string>;
  latestResults: Record<string, { headline: string; value?: string; band_label?: string; severity?: string }>;
}) {
  const total = items.length;
  const doneCount = items.filter((i) => completedSet.has(i.slug)).length;
  const allDone = doneCount === total && total > 0;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;

  // Cari index aksi "next" — yang pertama belum complete
  const nextIdx = items.findIndex((i) => !completedSet.has(i.slug));

  return (
    <div className="flex flex-col gap-3">
      {/* Progress card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-4 text-white">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">Progress MHCU</p>
            <p className="mt-1 text-xl font-bold">{doneCount} / {total} tahap selesai</p>
          </div>
          <p className="text-3xl">{allDone ? "🎉" : "🌱"}</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
        {allDone && (
          <Link href="/laporan/mhcu" className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-600 shadow-lg">
            🎯 Lihat Laporan MHCU Lengkap →
          </Link>
        )}
        {!allDone && doneCount > 0 && (
          <p className="mt-2 text-xs text-white/80">
            Tinggal {total - doneCount} tahap lagi. Lanjutin pelan-pelan, ga buru-buru.
          </p>
        )}
        {doneCount === 0 && (
          <p className="mt-2 text-xs text-white/80">
            Mulai dari tahap 1. Tiap tahap singkat (~3-5 menit).
          </p>
        )}
      </div>

      {/* Action list (sequential) */}
      <ol className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const done = completedSet.has(item.slug);
          const isNext = idx === nextIdx;
          const isLocked = !done && !isNext;

          // Done state: green check + status (NO clickable link, NO band/skor — hasil per-step ga boleh dilihat sebelum 6/6 selesai)
          if (done) {
            return (
              <li key={item.slug}>
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">✓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70">Tahap {idx + 1} · Selesai</p>
                    <p className="text-sm font-bold text-ink">{item.name}</p>
                  </div>
                </div>
              </li>
            );
          }

          // Next state: prominent CTA
          if (isNext) {
            return (
              <li key={item.slug}>
                <Link href={`/skrining/${item.slug}?flow=mhcu`} className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-sky-600">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-white/80">Tahap {idx + 1} · Berikutnya</p>
                    <p className="text-base font-bold">{item.name}</p>
                    <p className="text-xs text-white/85">{item.subtitle}</p>
                  </div>
                  <span className="text-lg font-bold">▶</span>
                </Link>
              </li>
            );
          }

          // Locked state: greyed out
          return (
            <li key={item.slug}>
              <div className="flex items-center gap-3 rounded-xl bg-ink/5 p-3 opacity-60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/15 text-sm font-bold text-ink/40">🔒</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink/40">Tahap {idx + 1} · Terkunci</p>
                  <p className="text-sm font-medium text-ink/55">{item.name}</p>
                  <p className="text-[10px] text-ink/40">Selesain tahap {nextIdx + 1} dulu</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-1 text-[11px] leading-relaxed text-ink/45 italic">
        Sequential biar pelan-pelan, ga overwhelming. Tiap tahap baru kebuka setelah tahap sebelumnya selesai.
      </p>
    </div>
  );
}
