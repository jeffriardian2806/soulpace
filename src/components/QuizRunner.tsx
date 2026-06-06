"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Quiz } from "@/core/quizzes";
import { computeResult } from "@/core/quizzes";
import { saveQuizResultAction } from "@/app/main/actions";

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function pick(type: string) {
    const next = [...answers, type];
    setAnswers(next);
    if (step + 1 < quiz.questions.length) {
      setStep(step + 1);
    } else {
      const result = computeResult(quiz, next);
      setDone(result);
      startTransition(() => {
        void saveQuizResultAction(quiz.key, result);
      });
    }
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setDone(null);
  }

  if (done) {
    const r = quiz.results[done];
    const wish = quiz.wishOf?.[done];
    return (
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-sky-600">Hasil refleksi</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{r.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{r.desc}</p>
        <p className="mt-3 text-xs text-ink/40">Ini cuma cerminan pola, bukan diagnosis.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {wish && (
            <Link
              href={`/compose?wish=${wish}`}
              className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
            >
              Curhat dengan label “{r.label}”
            </Link>
          )}
          <button
            type="button"
            onClick={restart}
            className="rounded-full glass px-4 py-2 text-xs font-medium text-ink/70"
          >
            Ulangi
          </button>
          <Link href="/main" className="rounded-full px-4 py-2 text-xs font-medium text-ink/50">
            Selesai
          </Link>
        </div>
      </div>
    );
  }

  const q = quiz.questions[step];
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-ink/45">
        <span>Pertanyaan {step + 1}/{quiz.questions.length}</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>
      <p className="mb-4 text-base font-semibold text-ink">{q.text}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pick(o.type)}
            className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-left text-sm text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
