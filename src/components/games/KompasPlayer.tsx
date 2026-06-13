"use client";
import { useState } from "react";

export type CompassQuestion = { id: string; text: string; letter: string };
export type CompassType = { letter: string; name: string; tagline: string; description: string; traits: string };
export type CompassMajor = { id: string; name: string; description: string; primary_letters: string[]; careers: string[] };

const LIKERT = [
  { score: 1, label: "Banget engga" },
  { score: 2, label: "Agak engga" },
  { score: 3, label: "Netral" },
  { score: 4, label: "Agak ya" },
  { score: 5, label: "Banget ya" },
];

const LETTER_EMOJI: Record<string, string> = { R: "🔧", I: "🔬", A: "🎨", S: "💙", E: "🚀", C: "📊" };

export function KompasPlayer({ questions, types, majors }: { questions: CompassQuestion[]; types: CompassType[]; majors: CompassMajor[] }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<{ letter: string; score: number }[]>([]);

  if (questions.length === 0 || types.length === 0) {
    return <p className="text-sm text-ink/50">Konten belum tersedia.</p>;
  }

  const done = idx >= questions.length;

  if (done) {
    // Tally per letter
    const totals: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    answers.forEach((a) => { totals[a.letter] = (totals[a.letter] ?? 0) + a.score; });

    // Sort letters by score desc
    const ranked = (Object.keys(totals) as string[])
      .map((l) => ({ letter: l, score: totals[l] }))
      .sort((a, b) => b.score - a.score);

    const top3 = ranked.slice(0, 3);
    const hollandCode = top3.map((t) => t.letter).join("");

    // Match majors by overlap with top 3
    const topLetters = new Set(top3.map((t) => t.letter));
    const scoredMajors = majors
      .map((m) => {
        let matchScore = 0;
        m.primary_letters.forEach((l, i) => {
          if (topLetters.has(l)) {
            // Bobot makin tinggi kalau letter ada di posisi awal & di top3 lebih tinggi
            const userRank = top3.findIndex((t) => t.letter === l);
            matchScore += (4 - userRank) * (3 - i > 0 ? 3 - i : 1);
          }
        });
        return { m, matchScore };
      })
      .filter((x) => x.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    const topTypeDetails = top3.map((t) => types.find((x) => x.letter === t.letter)).filter(Boolean) as CompassType[];

    const maxScorePerLetter = 25; // 5 questions × 5 max score

    return (
      <div className="flex flex-col gap-4 py-2">
        {/* Holland code */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-purple-600 p-6 text-center text-white shadow-2xl">
          <p className="text-xs uppercase tracking-wide text-white/70">Holland Code kamu</p>
          <p className="mt-2 text-4xl font-bold tracking-wider">{hollandCode}</p>
          <p className="mt-2 text-xs text-white/70">Top 3 tipe minat kamu</p>
        </div>

        {/* Breakdown bar */}
        <div className="rounded-2xl bg-white/70 p-4">
          <p className="mb-3 text-sm font-bold text-ink">Skor per tipe</p>
          <div className="flex flex-col gap-2">
            {ranked.map((r) => {
              const t = types.find((x) => x.letter === r.letter);
              const pct = (r.score / maxScorePerLetter) * 100;
              return (
                <div key={r.letter}>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/75">{LETTER_EMOJI[r.letter]} <strong>{r.letter}</strong> {t?.name}</span>
                    <span className="text-ink/55 tabular-nums">{r.score}/{maxScorePerLetter}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ink/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 3 type descriptions */}
        {topTypeDetails.map((t, i) => (
          <div key={t.letter} className="rounded-2xl bg-sky-50 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-bold text-white">#{i + 1}</span>
              <p className="text-sm font-bold text-ink">{LETTER_EMOJI[t.letter]} {t.letter} — {t.name}</p>
              <span className="text-xs italic text-ink/55">({t.tagline})</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{t.description}</p>
            <p className="mt-2 text-xs italic text-ink/55">{t.traits}</p>
          </div>
        ))}

        {/* Major recommendations */}
        {scoredMajors.length > 0 && (
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">🎓 Jurusan yang cocok buat kamu</p>
            <p className="mt-1 text-xs text-emerald-700/80">Top {scoredMajors.length} jurusan dengan tipe minat yang match.</p>
            <div className="mt-3 flex flex-col gap-3">
              {scoredMajors.map(({ m }) => (
                <div key={m.id} className="rounded-xl bg-white/70 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink">{m.name}</p>
                    <span className="text-[10px] tracking-wider text-sky-600">{m.primary_letters.join("·")}</span>
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
          </div>
        )}

        <p className="text-center text-xs text-ink/40">Bukan keputusan final — pake ini sebagai starting point eksplorasi, bukan kunci mati.</p>
        <button onClick={() => { setIdx(0); setAnswers([]); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white self-center">
          Coba lagi
        </button>
      </div>
    );
  }

  const q = questions[idx];

  function pick(score: number) {
    setAnswers([...answers, { letter: q.letter, score }]);
    setIdx(idx + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45 text-center">{idx + 1} / {questions.length}</p>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-lg">
        <p className="text-base leading-relaxed text-ink">{q.text}</p>
      </div>
      <p className="text-center text-xs text-ink/50">Seberapa setuju?</p>
      <div className="flex flex-col gap-2">
        {LIKERT.map((l) => (
          <button key={l.score} onClick={() => pick(l.score)} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/70 px-4 py-3 text-left text-sm text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]">
            <span>{l.label}</span>
            <span className="flex gap-0.5">
              {[1,2,3,4,5].map((n) => (
                <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= l.score ? "bg-sky-500" : "bg-sky-100"}`} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-1 pt-2">
        {questions.map((_, i) => (
          <div key={i} className={`h-1 w-3 rounded-full ${i < idx ? "bg-sky-400" : i === idx ? "bg-sky-200" : "bg-ink/10"}`} />
        ))}
      </div>
    </div>
  );
}
