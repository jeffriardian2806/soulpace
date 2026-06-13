"use client";
import { useState } from "react";

export type EmotionCard = { id: string; content: string; correct: string; options: string[] };

export function EmosiPlayer({ cards }: { cards: EmotionCard[] }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  if (cards.length === 0) return <p className="text-sm text-ink/50">Kartu belum tersedia.</p>;

  const done = idx >= cards.length;
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl">🎯</p>
        <p className="text-2xl font-bold text-ink">{score} / {cards.length}</p>
        <p className="text-center text-sm text-ink/65 max-w-sm">
          {score >= cards.length * 0.7 ? "Wow, peka banget." : score >= cards.length * 0.4 ? "Lumayan! Bisa diasah terus." : "Beberapa emosi memang halus banget — wajar."}
        </p>
        <button onClick={() => { setIdx(0); setScore(0); setPicked(null); }} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Main lagi</button>
      </div>
    );
  }

  const c = cards[idx];
  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === c.correct) setScore((s) => s + 1);
    setTimeout(() => { setIdx(idx + 1); setPicked(null); }, 800);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45 text-center">{idx + 1} / {cards.length}  Skor {score}</p>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-6 text-center shadow-lg">
        <p className="text-2xl leading-relaxed">{c.content}</p>
      </div>
      <p className="text-center text-xs text-ink/50">Emosi apa di balik kata ini?</p>
      <div className="grid grid-cols-2 gap-2">
        {c.options.map((o) => {
          const isCorrect = picked && o === c.correct;
          const isWrong = picked === o && o !== c.correct;
          return (
            <button key={o} onClick={() => pick(o)} disabled={!!picked}
              className={`rounded-2xl p-3 text-sm font-medium transition-colors ${
                isCorrect ? "bg-emerald-500 text-white" :
                isWrong ? "bg-rose-100 text-rose-700" :
                "bg-white/70 text-ink/80 ring-1 ring-sky-100 hover:bg-sky-50"
              } ${picked ? "cursor-default" : "active:scale-95"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
