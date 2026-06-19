"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCREENING_DISCLAIMER } from "@/config/screening";
import type { ScreeningInstrument } from "@/config/screening";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { saveGameResultAction } from "@/app/main/saveResult";
import { getSupportMessageAction } from "@/app/main/supportAction";
import { SupportMessageCard } from "@/components/SupportMessageCard";

// Mapping band label → severity slug (heuristic — Rey bisa adjust per instrumen)
function bandSeverity(label: string | undefined): "minimal" | "mild" | "moderate" | "severe" {
  if (!label) return "minimal";
  const l = label.toLowerCase();
  if (l.includes("berat") || l.includes("severe") || l.includes("parah")) return "severe";
  if (l.includes("sedang") || l.includes("moderate")) return "moderate";
  if (l.includes("ringan") || l.includes("mild")) return "mild";
  return "minimal";
}

type Answers = Record<string, (number | null)[]>;

function emptyAnswers(instruments: ScreeningInstrument[]): Answers {
  return Object.fromEntries(
    instruments.map((i) => [i.id, i.items.map(() => null)])
  );
}

export function ScreeningTool({
  instruments,
  flowMode = false,
  nextHref,
  flowStepLabel,
}: {
  instruments: ScreeningInstrument[];
  /**
   * Flow mode (mis. MHCU guided sequential):
   * - Tidak render hasil per-instrument setelah submit
   * - Auto-redirect ke `nextHref` setelah save selesai
   */
  flowMode?: boolean;
  nextHref?: string;
  flowStepLabel?: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(() =>
    emptyAnswers(instruments)
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const allAnswered = instruments.every((inst) =>
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
    setAnswers(emptyAnswers(instruments));
    setSubmitted(false);
    setError(false);
    window.scrollTo({ top: 0 });
  }

  if (instruments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink/40">
        Skrining belum tersedia saat ini.
      </p>
    );
  }

  // Hoist hasil supaya bisa di-save lewat useEffect tanpa duplikasi logic
  const results = submitted
    ? instruments.map((inst) => {
        const vals = answers[inst.id].map((v) => v ?? 0);
        const optVals = inst.options.map((o) => o.value);
        const minVal = Math.min(...optVals);
        const maxVal = Math.max(...optVals);
        const score = vals.reduce(
          (sum, v, idx) => sum + (inst.items[idx]?.reverse ? maxVal + minVal - v : v),
          0
        );
        const band = inst.bands.find((b) => score >= b.min && score <= b.max);
        const max = inst.items.length * maxVal;
        const crisis =
          inst.crisisItemIndex !== undefined && vals[inst.crisisItemIndex] > 0;
        return { inst, score, max, band, crisis };
      })
    : [];

  const savedRef = useRef(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  useEffect(() => {
    if (submitted && !savedRef.current && results.length > 0) {
      savedRef.current = true;

      // Save semua hasil + tag severity & crisis
      const savePromises = results.map((r) => {
        const severity = bandSeverity(r.band?.label);
        return saveGameResultAction(`screening_${r.inst.id}`, {
          title: r.inst.name,
          headline: r.band?.label ?? "-",
          value: `Skor ${r.score}/${r.max}`,
          secondary: r.inst.subtitle,
          emoji: "📋",
        }, {
          score: r.score,
          max: r.max,
          band_label: r.band?.label,
          band_advice: r.band?.advice,
          crisis: r.crisis,
          severity,
        });
      });

      // Flow mode (mis. MHCU): tunggu save settle, langsung redirect — skip support card & result render
      if (flowMode && nextHref) {
        Promise.allSettled(savePromises).then(() => {
          router.push(nextHref);
        });
        return;
      }

      // Mode normal: trigger support message (prioritas crisis > severe)
      const hasCrisis = results.some((r) => r.crisis);
      const hasSevere = results.some((r) => bandSeverity(r.band?.label) === "severe");
      if (hasCrisis) {
        getSupportMessageAction("crisis_screening").then(setSupportMessage);
      } else if (hasSevere) {
        getSupportMessageAction("severe_screening").then(setSupportMessage);
      }
    }
  }, [submitted, results, flowMode, nextHref, router]);

  // === Flow mode: skip render hasil, kasih loading screen sambil redirect ===
  if (submitted && flowMode) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-8 text-center text-white shadow-lg">
        <p className="text-4xl">✓</p>
        <p className="mt-3 text-base font-bold">{flowStepLabel ?? "Tahap selesai!"}</p>
        <p className="mt-1 text-xs text-white/85">
          Lanjut ke tahap berikutnya...
        </p>
      </div>
    );
  }

  if (submitted) {
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

        {supportMessage && <SupportMessageCard message={supportMessage} />}

        {results.map((r) => (
          <div key={r.inst.id} className="glass rounded-2xl p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-ink">
                {r.inst.name}  {r.inst.subtitle}
              </h2>
              <span className="text-xs text-ink/50">
                Skor {r.score}/{r.max}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-sky-700">
              {r.band?.label ?? "-"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">{r.band?.advice}</p>
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

      {instruments.map((inst) => (
        <section key={inst.id} className="glass rounded-2xl p-4">
          <h2 className="text-sm font-bold text-ink">
            {inst.name}  {inst.subtitle}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/60">{inst.prompt}</p>

          <div className="mt-3 space-y-4">
            {inst.items.map((item, idx) => (
              <div key={idx} className="border-t border-ink/5 pt-3 first:border-0 first:pt-0">
                <p className="text-sm leading-relaxed text-ink">
                  {idx + 1}. {item.text}
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
        {flowMode
          ? (nextHref === "/laporan/mhcu" ? "Selesain MHCU & lihat hasil →" : "Lanjut tahap berikutnya →")
          : "Lihat hasil"}
      </button>
    </div>
  );
}
