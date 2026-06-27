"use client";

import { useActionState, useState } from "react";

type State = { error: string | null; success?: boolean };
type Action = (prev: State, fd: FormData) => Promise<State>;

export function FeedbackForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {
    error: null,
  });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.success) {
    return (
      <div className="rounded-2xl bg-sky-50 p-4 text-sm">
        <p className="font-semibold text-ink">Makasih atas masukannya 🙏</p>
        <p className="mt-1 leading-relaxed text-ink/70">
          Setiap masukan bantu Flouwell jadi lebih baik.
        </p>
      </div>
    );
  }

  const active = hover || rating;

  return (
    <form action={formAction} className="glass flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} bintang`}
            className="p-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 transition-colors"
              fill={n <= active ? "#FBBF24" : "none"}
              stroke={n <= active ? "#FBBF24" : "#CBD5E1"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
      <input type="hidden" name="rating" value={rating} />
      <textarea
        name="comment"
        rows={4}
        maxLength={2000}
        placeholder="Ceritain apa yang kamu suka atau yang bisa diperbaiki (opsional)..."
        className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || rating === 0}
        className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim masukan"}
      </button>
    </form>
  );
}
