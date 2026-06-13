"use client";

import { useState, useTransition } from "react";
import { votePollAction } from "@/app/main/actions";

export function PollWidget({
  poll,
  initialVoted,
  initialCounts,
  initialTotal,
}: {
  poll: { id: string; question: string; options: string[] };
  initialVoted: number | null;
  initialCounts: Record<string, number>;
  initialTotal: number;
}) {
  const [voted, setVoted] = useState<number | null>(initialVoted);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [total, setTotal] = useState(initialTotal);
  const [pending, startTransition] = useTransition();

  function vote(idx: number) {
    if (voted !== null || pending) return;
    setVoted(idx);
    setCounts((c) => ({ ...c, [idx]: (c[idx] ?? 0) + 1 }));
    setTotal((t) => t + 1);
    startTransition(() => { void votePollAction(poll.id, idx); });
  }

  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-3 text-base font-semibold text-ink">{poll.question}</p>
      <div className="flex flex-col gap-2">
        {poll.options.map((o, idx) => {
          const c = counts[idx] ?? 0;
          const pct = total ? Math.round((c / total) * 100) : 0;
          const show = voted !== null;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => vote(idx)}
              disabled={show}
              className="relative overflow-hidden rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-left text-sm text-ink/80"
            >
              {show && (
                <span
                  className="absolute inset-y-0 left-0 bg-sky-100"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              )}
              <span className="relative flex justify-between">
                <span>{o}{voted === idx ? "  (kamu)" : ""}</span>
                {show && <span className="font-medium text-ink/60">{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {voted !== null && (
        <p className="mt-3 text-xs text-ink/45">Kamu nggak sendirian — {total} orang ikut milih.</p>
      )}
    </div>
  );
}
