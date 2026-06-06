"use client";

import { useState, useTransition } from "react";
import { MOODS } from "@/core/moods";
import { createStatusAction } from "@/app/feed/actions";

export function MoodCheckIn({ onPosted }: { onPosted?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setSelected(null);
    setText("");
    setError(null);
  }

  function submit() {
    if (!selected) return;
    startTransition(async () => {
      const res = await createStatusAction(selected, text);
      if (res?.error) {
        setError(res.error);
        return;
      }
      reset();
      onPosted?.();
    });
  }

  return (
    <section className="glass rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-ink">Gimana perasaan kamu hari ini?</p>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => setSelected(selected === m.slug ? null : m.slug)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === m.slug
                ? "bg-sky-500 text-white"
                : "bg-white/70 text-ink/70 hover:bg-sky-50"
            }`}
          >
            <span className="text-sm leading-none">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            placeholder="Mau cerita sedikit? (opsional)"
            className="rounded-xl border border-sky-100 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Membagikan..." : "Bagikan sebagai status"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-3 py-2 text-xs font-medium text-ink/50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
