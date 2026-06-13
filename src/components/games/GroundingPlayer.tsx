"use client";

import { useState } from "react";

export type GroundingStep = { count: number; sense: string; instr: string; emoji: string };

export function GroundingPlayer({ steps }: { steps: GroundingStep[] }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  if (steps.length === 0) {
    return <p className="text-sm text-ink/50">Langkah grounding belum tersedia.</p>;
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-5xl">🌿</p>
        <p className="text-center text-base font-medium text-ink">Kamu udah balik ke sini, ke sekarang.</p>
        <p className="max-w-sm text-center text-sm text-ink/65">
          Cemas itu sering ngajak pikiran lompat ke masa lalu atau masa depan. Indra-mu jaga kamu di present.
        </p>
        <button onClick={() => { setStepIdx(0); setProgress(0); setDone(false); }} className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white">
          Mulai lagi
        </button>
      </div>
    );
  }

  const step = steps[stepIdx];

  function tap() {
    const next = progress + 1;
    if (next >= step.count) {
      if (stepIdx + 1 < steps.length) { setStepIdx((i) => i + 1); setProgress(0); }
      else setDone(true);
    } else setProgress(next);
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <p className="text-6xl">{step.emoji}</p>
      <p className="text-center text-2xl font-bold text-ink">{step.count - progress} kali {step.sense}</p>
      <p className="max-w-sm text-center text-sm leading-relaxed text-ink/65">{step.instr}</p>
      <div className="flex gap-2">
        {Array.from({ length: step.count }).map((_, i) => (
          <div key={i} className={`h-3 w-8 rounded-full ${i < progress ? "bg-sky-500" : "bg-sky-100"}`} />
        ))}
      </div>
      <button onClick={tap} className="mt-2 rounded-full bg-sky-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 active:scale-95">
        Udah, ✓
      </button>
      <p className="text-xs text-ink/40">Langkah {stepIdx + 1} dari {steps.length}</p>
    </div>
  );
}
