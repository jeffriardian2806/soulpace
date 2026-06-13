"use client";

import { useState } from "react";

type Bubble = { id: number; text: string; x: number };

export function LepasPlayer() {
  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);

  function add() {
    const t = input.trim();
    if (!t) return;
    setBubbles((b) => [...b, { id: Date.now() + Math.random(), text: t.slice(0, 80), x: 10 + Math.random() * 70 }]);
    setInput("");
  }

  function pop(id: number) {
    setBubbles((b) => b.filter((x) => x.id !== id));
    setPopped((p) => p + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={80}
          placeholder="Tulis 1 pikiran yang ganggu…"
          className="flex-1 rounded-xl border border-sky-100 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-sky-300"
        />
        <button onClick={add} className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">
          Lepasin
        </button>
      </div>

      <div className="relative h-[480px] overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-white">
        {bubbles.length === 0 && (
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-sm text-ink/40">
            Balon-balon kamu nanti muncul di sini.
          </p>
        )}
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b.id)}
            className="absolute flex max-w-[60%] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-sky-400 p-4 text-center text-xs font-medium text-white shadow-lg shadow-sky-500/30"
            style={{
              left: `${b.x}%`,
              animation: "lepas-float 14s linear forwards",
            }}
            aria-label={`Pecahin: ${b.text}`}
          >
            {b.text}
          </button>
        ))}
      </div>

      {popped > 0 && (
        <p className="rounded-xl bg-sky-50 p-3 text-center text-xs text-ink/70">
          Udah lepasin {popped} pikiran. Lega sedikit ya — boleh lanjut, boleh berhenti.
        </p>
      )}

      <style jsx>{`
        @keyframes lepas-float {
          from { bottom: -80px; opacity: 1; }
          to { bottom: 100%; opacity: 0.6; }
        }
        button[aria-label^="Pecahin"] { bottom: -80px; }
      `}</style>
    </div>
  );
}
