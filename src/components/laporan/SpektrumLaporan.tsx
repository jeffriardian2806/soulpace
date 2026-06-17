import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";

type Category = { id: string; slug: string; name: string; emoji: string; description: string };
type Detail = { intro?: number; extro?: number; by_category?: Record<string, { intro: number; extro: number }> };

export function SpektrumLaporan({ result, categories }: { result: { summary: { headline: string; value?: string }; detail: Detail | null; created_at: string }; categories: Category[] }) {
  const detail = result.detail ?? {};
  const introPct = typeof detail.intro === "number" ? detail.intro : 50;
  const extroPct = typeof detail.extro === "number" ? detail.extro : 50;
  const byCat = detail.by_category ?? {};
  const dominant = introPct >= extroPct ? "introvert" : "extrovert";
  const gap = Math.abs(introPct - extroPct);
  const ambivert = gap < 15;

  const insight = ambivert
    ? "Kamu termasuk ambivert — punya sisi introvert dan extrovert yang seimbang. Bisa adaptasi ke ramai maupun sendirian. Kelebihan: fleksibel. Tantangan: kadang bingung kapan butuh apa — kenalin sinyal tubuh kamu."
    : dominant === "introvert"
      ? "Kecenderungan kamu lebih ke introvert. Recharge kamu dari ketenangan & ruang sendiri, bukan dari kerumunan. Kelebihan: pendengar yang baik, mikir mendalam. Tantangan: gampang drained di situasi sosial yang lama."
      : "Kecenderungan kamu lebih ke extrovert. Recharge kamu dari interaksi & kerumunan. Kelebihan: gampang bangun koneksi, energi tinggi. Tantangan: bisa overwhelm orang lain yang lebih introvert, dan butuh waktu sendiri kadang.";

  return (
    <LaporanShell title="Spektrum Sosial" takenAt={result.created_at}>
      <HeroCard
        emoji="🌗"
        label="Spektrum kamu"
        headline={result.summary.headline}
        value={`🌙 ${introPct.toFixed(2)}% Introvert · ${extroPct.toFixed(2)}% Extrovert 🌞`}
      />

      <LaporanSection icon="💡" title="Apa artinya">
        <p className="text-sm leading-relaxed text-ink/80">{insight}</p>
      </LaporanSection>

      <LaporanSection icon="📊" title="Breakdown per kategori" hint="Pola kamu di area kehidupan yang berbeda">
        <div className="flex flex-col gap-3">
          {categories.map((c) => {
            const d = byCat[c.id] ?? { intro: 0, extro: 0 };
            const sum = d.intro + d.extro;
            const iPct = sum > 0 ? (d.intro / sum) * 100 : 50;
            const ePct = 100 - iPct;
            const catDominant = iPct >= 50 ? "introvert" : "extrovert";
            const catGap = Math.abs(iPct - ePct);
            return (
              <div key={c.id} className="rounded-xl bg-white/40 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="text-sm font-medium text-ink">{c.emoji} {c.name}</p>
                  <span className="text-xs text-ink/55 tabular-nums">{iPct.toFixed(0)}% intro / {ePct.toFixed(0)}% extro</span>
                </div>
                <div className="mt-2 relative h-2 overflow-hidden rounded-full bg-rose-200">
                  <div className="absolute left-0 top-0 h-full bg-sky-400" style={{ width: `${iPct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink/55">
                  {catGap < 15 ? `Di area ini kamu seimbang — bisa adaptasi.` : `Di area ini kamu cenderung lebih ${catDominant === "introvert" ? "introvert" : "extrovert"}.`}
                </p>
              </div>
            );
          })}
        </div>
      </LaporanSection>

      <LaporanSection icon="🎯" title="Saran konkret">
        <ul className="flex flex-col gap-2 text-sm text-ink/80">
          {ambivert ? (
            <>
              <li className="flex gap-2"><span>•</span><span>Kenalin pola: kategori mana yang kamu lebih intro, mana yang lebih extro. Itu fingerprint kamu.</span></li>
              <li className="flex gap-2"><span>•</span><span>Manfaatin fleksibilitas — kamu bisa lead di sosial dan reflect sendiri sama kuatnya.</span></li>
            </>
          ) : dominant === "introvert" ? (
            <>
              <li className="flex gap-2"><span>•</span><span>Jadwalin <strong>me-time setelah event sosial</strong> — minimum 30 menit sebelum interaksi lain.</span></li>
              <li className="flex gap-2"><span>•</span><span>Komunikasiin sama orang terdekat: &ldquo;Aku butuh hening setelah ini, bukan karena marah.&rdquo;</span></li>
              <li className="flex gap-2"><span>•</span><span>Coba <strong>Ruang Hening</strong> atau <strong>Tarik Napas</strong> di app ini buat recharge.</span></li>
            </>
          ) : (
            <>
              <li className="flex gap-2"><span>•</span><span>Aware: ga semua orang energik kayak kamu — kasih ruang ke teman yang lebih introvert.</span></li>
              <li className="flex gap-2"><span>•</span><span>Tetep sisain me-time biar ga over-stimulated walaupun kamu suka rame.</span></li>
              <li className="flex gap-2"><span>•</span><span>Coba <strong>Jurnal Pribadi</strong> kalau pikiran banyak — tulis biar ga over-share ke orang lain.</span></li>
            </>
          )}
        </ul>
      </LaporanSection>

      <LaporanActions retakeHref="/main/spektrum" />
    </LaporanShell>
  );
}
