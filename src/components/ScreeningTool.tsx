"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SCREENING_INSTRUMENTS,
  SCREENING_DISCLAIMER,
} from "@/config/screening";
import { CRISIS_RESOURCE } from "@/core/crisisResources";

type Answers = Record<string, (number | null)[]>;

function emptyAnswers(): Answers {
  return Object.fromEntries(
    SCREENING_INSTRUMENTS.map((i) => [i.id, i.items.map(() => null)])
  );
}

export function ScreeningTool() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const allAnswered = SCREENING_INSTRUMENTS.every((inst) =>
    answers[inst.id].every((a) => a !== null)
  );

  function setAnswer(instId: string, idx: number, val: number) {
    setAnswers((prev) => ({
      ...prev,
      [instId]: prev[instId].map((a, i) => (i === idx ? val : a)),
    }));
  }

  function onSubmit() {
    if (!allAnswered) {
      setError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError(false);
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  }

  function reset() {
    setAnswers(emptyAnswers());
    setSubmitted(false);
    setError(false);
    window.scrollTo({ top: 0 });
  }

  if (submitted) {
    const results = SCREENING_INSTRUMENTS.map((inst) => {
      const vals = answers[inst.id].map((v) => v ?? 0);
      const score = vals.reduce((s, v) => s + v, 0);
      const band = inst.bands.find((b) => score >= b.min && score <= b.max);
      const maxVal = Math.max(...inst.options.map((o) => o.value));
      const max = inst.items.length * maxVal;
      const crisis =
        inst.crisisItemIndex !== undefined &&
        vals[inst.crisisItemIndex] > 0;
      return { inst, score, max, band, crisis };
    });
    const anyCrisis = results.some((r) => r.crisis);

    return (
      <div className="space-y-4">
        {anyCrisis && (
          <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm leading-relaxed text-ink/80">
            <p className="font-semibold text-ink">Tolong jangan hadapi ini sendirian.</p>
            <p className="mt-1">
              {CRISIS_RESOURCE.message} Kamu bisa telepon{" "}
              <span className="font-semibold">{CRISIS_RESOURCE.phone}</span> (SEJIWA,
              gratis 24 jam) atau kunjungi{" "}
              <a
                href={CRISIS_RESOURCE.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="font-medium text-sky-600 underline"
              >
                healing119.id
              </a>
              . Kalau ada orang yang kamu percaya, cerita ke mereka juga.
            </p>
          </div>
        )}

        {results.map((r) => (
          <div key={r.inst.id} className="glass rounded-2xl p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-ink">
                {r.inst.name} · {r.inst.subtitle}
              </h2>
              <span className="text-xs text-ink/50">
                Skor {r.score}/{r.max}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-sky-700">
              {r.band?.label ?? "-"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">
              {r.band?.advice}
            </p>
          </div>
        ))}

        <div className="rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-ink/65">
          {SCREENING_DISCLAIMER} Untuk pemahaman dan penanganan yang tepat, konsultasikan
          ke psikolog atau psikiater.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white"
          >
            Ulangi skrining
          </button>
          <Link
            href="/edukasi"
            className="rounded-xl glass px-4 py-2 text-sm font-medium text-ink/70"
          >
            Lihat tips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-ink/65">
        {SCREENING_DISCLAIMER}
      </div>

      {error && (
        <p className="text-sm font-medium text-rose-600">
          Masih ada pertanyaan yang belum dijawab ya.
        </p>
      )}

      {SCREENING_INSTRUMENTS.map((inst) => (
        <section key={inst.id} className="glass rounded-2xl p-4">
          <h2 className="text-sm font-bold text-ink">
            {inst.name} · {inst.subtitle}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/60">{inst.prompt}</p>

          <div className="mt-3 space-y-4">
            {inst.items.map((item, idx) => (
              <div key={idx} className="border-t border-ink/5 pt-3 first:border-0 first:pt-0">
                <p className="text-sm leading-relaxed text-ink">
                  {idx + 1}. {item}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inst.options.map((opt) => {
                    const active = answers[inst.id][idx] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(inst.id, idx, opt.value)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          active
                            ? "bg-sky-500 text-white"
                            : "glass text-ink/70 hover:bg-sky-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={onSubmit}
        className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
      >
        Lihat hasil
      </button>
    </div>
  );
}
