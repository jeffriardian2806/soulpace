"use client";
import { useState } from "react";

export type DetectiveOption = { slug: string; label: string; explanation: string };
export type DetectiveCase = { id: string; content: string; correct: string; options: DetectiveOption[] };

export function DetektifPlayer({ cases }: { cases: DetectiveCase[] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  if (cases.length === 0) return <p className="text-sm text-ink/50">Kasus belum tersedia.</p>;

  const done = idx >= cases.length;
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl">🔍</p>
        <p className="text-2xl font-bold text-ink">{score} / {cases.length}</p>
        <p className="text-center text-sm leading-relaxed text-ink/65 max-w-sm">
          {score >= cases.length * 0.7 ? "Bagus banget bacanya — kamu peka sama nuansa." : score >= cases.length * 0.4 ? "Lumayan! EQ butuh latihan, ini termasuk." : "Susah ya — wajar. Banyak emosi yang ke-cover sama kata-kata. Latihan terus."}
        </p>
        <button onClick={() => { setIdx(0); setPicked(null); setScore(0); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Main lagi</button>
      </div>
    );
  }

  const c = cases[idx];
  const correctOpt = c.options.find((o) => o.slug === c.correct);

  function pick(slug: string) {
    if (picked) return;
    setPicked(slug);
    if (slug === c.correct) setScore((x) => x + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45 text-center">{idx + 1} / {cases.length}</p>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-lg">
        <p className="text-xs uppercase tracking-wide text-sky-600">Apa emosi sebenarnya?</p>
        <p className="mt-2 text-base leading-relaxed text-ink">{c.content}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {c.options.map((o) => {
          const isCorrect = picked && o.slug === c.correct;
          const isWrongPick = picked === o.slug && o.slug !== c.correct;
          return (
            <button key={o.slug} onClick={() => pick(o.slug)} disabled={!!picked}
              className={`rounded-2xl p-3 text-sm font-medium transition-colors ${
                isCorrect ? "bg-emerald-500 text-white" :
                isWrongPick ? "bg-rose-100 text-rose-700" :
                "bg-white/70 text-ink/80 ring-1 ring-sky-100 hover:bg-sky-50"
              } ${picked ? "cursor-default" : "active:scale-95"}`}>
              {o.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-xs font-semibold text-sky-700">{picked === c.correct ? "✓ Tepat" : `Jawaban: ${correctOpt?.label}`}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{c.options.find((o) => o.slug === c.correct)?.explanation}</p>
          <button onClick={() => { setIdx(idx + 1); setPicked(null); }} className="mt-3 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white">Lanjut →</button>
        </div>
      )}
    </div>
  );
}
