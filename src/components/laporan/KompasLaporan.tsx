import { LaporanShell, LaporanSection, LaporanActions, HeroCard } from "./LaporanShell";

type CompassType = { letter: string; name: string; tagline: string; description: string; traits: string };
type CompassMajor = { id: string; name: string; description: string; primary_letters: string[]; careers: string[] };
type Detail = { holland_code?: string; totals?: Record<string, number>; top3?: { letter: string; score: number }[] };

const LETTER_EMOJI: Record<string, string> = { R: "🔧", I: "🔬", A: "🎨", S: "💙", E: "🚀", C: "📊" };
const MAX_PER_LETTER = 25;

export function KompasLaporan({ result, types, majors }: { result: { summary: { headline: string; value?: string }; detail: Detail | null; created_at: string }; types: CompassType[]; majors: CompassMajor[] }) {
  const detail = result.detail ?? {};
  const totals = detail.totals ?? { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const top3 = detail.top3 ?? [];
  const hollandCode = detail.holland_code ?? result.summary.headline;
  const topLetters = new Set(top3.map((t) => t.letter));

  // Sort letters by score
  const ranked = (Object.keys(totals) as string[])
    .map((l) => ({ letter: l, score: totals[l] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // Top 3 type details
  const topTypeDetails = top3.map((t) => types.find((x) => x.letter === t.letter)).filter(Boolean) as CompassType[];

  // Recommended majors — match score by overlap with top 3
  const scoredMajors = majors
    .map((m) => {
      let matchScore = 0;
      m.primary_letters.forEach((l, i) => {
        if (topLetters.has(l)) {
          const userRank = top3.findIndex((t) => t.letter === l);
          matchScore += (4 - userRank) * (3 - i > 0 ? 3 - i : 1);
        }
      });
      return { m, matchScore };
    })
    .filter((x) => x.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  return (
    <LaporanShell title="Kompas Jurusan" takenAt={result.created_at}>
      <HeroCard
        emoji="🧭"
        label="Holland Code kamu"
        headline={hollandCode}
        value={top3.map((t) => types.find((x) => x.letter === t.letter)?.name).filter(Boolean).join(" · ")}
        gradient="from-sky-500 via-purple-500 to-rose-500"
      />

      <LaporanSection icon="📊" title="Skor per tipe RIASEC">
        <div className="flex flex-col gap-2">
          {ranked.map((r) => {
            const t = types.find((x) => x.letter === r.letter);
            const pct = (r.score / MAX_PER_LETTER) * 100;
            const isTop = topLetters.has(r.letter);
            return (
              <div key={r.letter}>
                <div className="flex justify-between text-xs">
                  <span className={isTop ? "font-bold text-ink" : "text-ink/65"}>
                    {LETTER_EMOJI[r.letter]} <strong>{r.letter}</strong> {t?.name}
                  </span>
                  <span className="text-ink/55 tabular-nums">{r.score} / {MAX_PER_LETTER}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-ink/5">
                  <div className={`h-full rounded-full ${isTop ? "bg-gradient-to-r from-sky-400 to-purple-500" : "bg-ink/20"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </LaporanSection>

      <LaporanSection icon="💡" title="Profil top 3 kamu" hint="Tipe minat yang paling dominan, plus karakter masing-masing">
        <div className="flex flex-col gap-3">
          {topTypeDetails.map((t, i) => (
            <div key={t.letter} className="rounded-xl bg-sky-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-bold text-white">#{i + 1}</span>
                <p className="text-sm font-bold text-ink">{LETTER_EMOJI[t.letter]} {t.letter} — {t.name}</p>
                <span className="text-xs italic text-ink/55">({t.tagline})</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{t.description}</p>
              <p className="mt-1.5 text-xs italic text-ink/55">{t.traits}</p>
            </div>
          ))}
        </div>
      </LaporanSection>

      {scoredMajors.length > 0 && (
        <LaporanSection icon="🎓" title="Rekomendasi jurusan" hint={`Top ${scoredMajors.length} jurusan kuliah yang match sama profil minat kamu`}>
          <div className="flex flex-col gap-3">
            {scoredMajors.map(({ m }) => (
              <div key={m.id} className="rounded-xl bg-white/70 p-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-bold text-ink">{m.name}</p>
                  <span className="text-[10px] tracking-wider text-sky-600">{m.primary_letters.join(" · ")}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/65">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.careers.slice(0, 4).map((c, ci) => (
                    <span key={ci} className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </LaporanSection>
      )}

      <LaporanSection icon="🎯" title="Saran langkah selanjutnya">
        <ul className="flex flex-col gap-2 text-sm text-ink/80">
          <li className="flex gap-2"><span>•</span><span>Eksplor 2-3 jurusan rekomendasi di atas — cek kurikulum sebenarnya, lihat alumninya di LinkedIn.</span></li>
          <li className="flex gap-2"><span>•</span><span>Ngobrol sama orang yang udah kerja di bidang tersebut, atau ikut event/webinar career.</span></li>
          <li className="flex gap-2"><span>•</span><span>Hasil ini bukan keputusan final — pake sebagai starting point, bukan kunci mati.</span></li>
          <li className="flex gap-2"><span>•</span><span>Bingung mau pilih jurusan? Konsul ke guru BK atau konselor karir di sekolah.</span></li>
        </ul>
      </LaporanSection>

      <LaporanActions retakeHref="/main/kompas" />
    </LaporanShell>
  );
}
