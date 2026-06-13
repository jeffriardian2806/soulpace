"use client";

import { useState } from "react";

export type Category = "distorsi" | "netral" | "sehat";
export type CbtThought = {
  text: string;
  correct: Category;
  insight: string;
  distortion_type?: string | null;
};
export type CbtScenario = { id: string; context: string; thoughts: CbtThought[] };

const CATEGORY_INFO: Record<Category, { label: string; color: string; bg: string }> = {
  distorsi: { label: "🔴 Distorsi", color: "text-rose-700", bg: "bg-rose-100" },
  netral: { label: "🟡 Netral", color: "text-amber-700", bg: "bg-amber-100" },
  sehat: { label: "🟢 Sehat", color: "text-emerald-700", bg: "bg-emerald-100" },
};

export function TantangPlayer({ scenarios }: { scenarios: CbtScenario[] }) {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [answers, setAnswers] = useState<Category[]>([]);
  const [pickedHealthy, setPickedHealthy] = useState<number | null>(null);

  if (scenarios.length === 0) {
    return <p className="text-sm text-ink/50">Skenario belum tersedia. Hubungi admin.</p>;
  }

  const scenario = scenarios[scenarioIdx];
  const currentIdx = answers.length;
  const done = answers.length === scenario.thoughts.length;

  function classify(cat: Category) { setAnswers([...answers, cat]); }

  function nextScenario() {
    if (scenarioIdx + 1 < scenarios.length) { setScenarioIdx((i) => i + 1); setAnswers([]); setPickedHealthy(null); }
    else { setScenarioIdx(0); setAnswers([]); setPickedHealthy(null); }
  }

  if (done) {
    const healthyThoughts = scenario.thoughts
      .map((t, i) => ({ ...t, i }))
      .filter((t) => t.correct === "sehat" || t.correct === "netral");
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Skenario</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{scenario.context}</p>
        </div>
        <p className="text-sm font-semibold text-ink">Review:</p>
        <div className="flex flex-col gap-3">
          {scenario.thoughts.map((t, i) => {
            const userAnswer = answers[i];
            const correct = userAnswer === t.correct;
            return (
              <div key={i} className="rounded-xl border border-sky-100 bg-white/70 p-3">
                <p className="text-sm leading-relaxed text-ink/85">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${CATEGORY_INFO[t.correct].bg} ${CATEGORY_INFO[t.correct].color}`}>
                    Jawaban: {CATEGORY_INFO[t.correct].label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ${correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {correct ? "✓ Tepat" : `Kamu: ${CATEGORY_INFO[userAnswer].label}`}
                  </span>
                  {t.distortion_type && (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-ink/55">Pola: {t.distortion_type}</span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink/65">{t.insight}</p>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800">Mana yang mau kamu pegang hari ini?</p>
          <p className="mt-1 text-xs text-emerald-700/80">Pilih 1 pikiran sehat. Tulis di catetan kamu, biar gampang inget waktu pikiran lama balik.</p>
          <div className="mt-3 flex flex-col gap-2">
            {healthyThoughts.map((t) => (
              <button
                key={t.i}
                onClick={() => setPickedHealthy(t.i)}
                className={`rounded-xl p-3 text-left text-sm leading-relaxed transition-colors ${
                  pickedHealthy === t.i ? "bg-emerald-500 text-white" : "bg-white/80 text-ink/80 hover:bg-emerald-100"
                }`}
              >
                &ldquo;{t.text}&rdquo;
              </button>
            ))}
          </div>
        </div>
        <button onClick={nextScenario} className="mt-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white">
          {scenarioIdx + 1 < scenarios.length ? "Skenario berikutnya →" : "Ulangi dari awal"}
        </button>
      </div>
    );
  }

  const thought = scenario.thoughts[currentIdx];
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-sky-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Skenario {scenarioIdx + 1} / {scenarios.length}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/85">{scenario.context}</p>
      </div>
      <p className="text-xs text-ink/45">Pikiran {currentIdx + 1} dari {scenario.thoughts.length}</p>
      <div className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-lg">
        <p className="text-base leading-relaxed text-ink">&ldquo;{thought.text}&rdquo;</p>
      </div>
      <p className="text-center text-xs text-ink/50">Menurut kamu, ini kategori apa?</p>
      <div className="grid grid-cols-3 gap-2">
        {(["distorsi", "netral", "sehat"] as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => classify(c)}
            className={`rounded-2xl p-3 text-xs font-semibold transition-transform active:scale-95 ${CATEGORY_INFO[c].bg} ${CATEGORY_INFO[c].color}`}
          >
            {CATEGORY_INFO[c].label}
          </button>
        ))}
      </div>
    </div>
  );
}
