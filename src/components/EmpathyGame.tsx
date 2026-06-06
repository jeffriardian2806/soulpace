"use client";

import { useState } from "react";
import Link from "next/link";
import { EMPATHY_SCENARIOS } from "@/core/empathyScenarios";

export function EmpathyGame() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [safeCount, setSafeCount] = useState(0);
  const [answered, setAnswered] = useState(0);

  const s = EMPATHY_SCENARIOS[i];
  const last = i + 1 >= EMPATHY_SCENARIOS.length;

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    setAnswered((a) => a + 1);
    if (s.options[idx].safe) setSafeCount((c) => c + 1);
  }
  function next() {
    setPicked(null);
    setI((x) => x + 1);
  }

  if (i >= EMPATHY_SCENARIOS.length) {
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-3xl">💙</p>
        <h2 className="mt-2 text-lg font-bold text-ink">Skill empati kamu hari ini</h2>
        <p className="mt-1 text-sm text-ink/70">
          {safeCount} dari {answered} respons kamu menenangkan & tidak menghakimi.
        </p>
        <p className="mt-2 text-xs text-ink/45">
          Bukan skor buat dibandingin sama orang — ini latihan jadi pendengar yang lebih hangat.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => { setI(0); setPicked(null); setSafeCount(0); setAnswered(0); }}
            className="rounded-full glass px-4 py-2 text-xs font-medium text-ink/70"
          >
            Main lagi
          </button>
          <Link href="/feed" className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white">
            Bantu yang belum dibalas
          </Link>
        </div>
      </div>
    );
  }

  const opt = picked !== null ? s.options[picked] : null;
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-sky-600">{s.topic}</p>
      <p className="mb-4 rounded-xl bg-sky-50 p-3 text-sm leading-relaxed text-ink/80">{s.situation}</p>
      <p className="mb-2 text-sm font-semibold text-ink">Mana respons paling aman?</p>
      <div className="flex flex-col gap-2">
        {s.options.map((o, idx) => {
          const show = picked !== null;
          const cls = !show
            ? "border-sky-100 bg-white/70 hover:border-sky-400 hover:bg-sky-50"
            : o.safe
              ? "border-green-300 bg-green-50"
              : idx === picked
                ? "border-red-300 bg-red-50"
                : "border-sky-100 bg-white/40 opacity-60";
          return (
            <button
              key={idx}
              type="button"
              onClick={() => choose(idx)}
              disabled={show}
              className={`rounded-xl border px-4 py-3 text-left text-sm text-ink/80 transition-colors ${cls}`}
            >
              {o.text}
            </button>
          );
        })}
      </div>
      {opt && (
        <div className="mt-3 rounded-xl bg-ink/5 p-3 text-sm leading-relaxed text-ink/75">
          {opt.safe ? "✅ " : "💡 "}{opt.feedback}
          <div className="mt-3">
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
            >
              {last ? "Lihat hasil" : "Lanjut"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
