"use client";

import { useEffect, useState } from "react";

export type BreathProtocol = {
  slug: string;
  label: string;
  in_seconds: number;
  hold_seconds: number;
  out_seconds: number;
};

type Phase = "idle" | "in" | "hold" | "out";

export function NapasPlayer({ protocols }: { protocols: BreathProtocol[] }) {
  const [protocolIdx, setProtocolIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [secLeft, setSecLeft] = useState(0);
  const [cycles, setCycles] = useState(0);

  const p = protocols[protocolIdx];
  const dur = (ph: Exclude<Phase, "idle">) =>
    ph === "in" ? p.in_seconds : ph === "hold" ? p.hold_seconds : p.out_seconds;
  const label = (ph: Exclude<Phase, "idle">) =>
    ph === "in" ? "Tarik napas…" : ph === "hold" ? "Tahan…" : "Lepas pelan…";

  useEffect(() => {
    if (phase === "idle") return;
    if (secLeft <= 0) {
      if (phase === "in") { setPhase("hold"); setSecLeft(dur("hold")); return; }
      if (phase === "hold") { setPhase("out"); setSecLeft(dur("out")); return; }
      if (phase === "out") { setCycles((c) => c + 1); setPhase("in"); setSecLeft(dur("in")); return; }
    }
    const t = setTimeout(() => setSecLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secLeft]);

  if (!p) return <p className="text-sm text-ink/50">Protokol napas belum tersedia.</p>;

  function start() { setPhase("in"); setSecLeft(dur("in")); setCycles(0); }
  function stop() { setPhase("idle"); setSecLeft(0); }

  const scale = phase === "in" ? 1.4 : phase === "out" ? 0.7 : phase === "hold" ? 1.4 : 1;
  const trans = phase === "in" ? dur("in") : phase === "out" ? dur("out") : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {protocols.length > 1 && phase === "idle" && (
        <div className="flex flex-wrap justify-center gap-2">
          {protocols.map((pp, i) => (
            <button
              key={pp.slug}
              onClick={() => setProtocolIdx(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                i === protocolIdx ? "bg-sky-500 text-white" : "bg-white/70 text-ink/70 ring-1 ring-sky-100"
              }`}
            >
              {pp.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-500 text-white shadow-2xl shadow-sky-500/30"
        style={{ transform: `scale(${scale})`, transition: `transform ${trans}s ease-in-out` }}
      >
        <p className="text-center text-base font-medium">
          {phase === "idle" ? "Siap?" : label(phase)}
          {phase !== "idle" && <span className="mt-1 block text-3xl font-bold tabular-nums">{secLeft}</span>}
        </p>
      </div>

      {phase === "idle" ? (
        <button onClick={start} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">Mulai</button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-ink/50">Siklus ke-{cycles + 1}</p>
          <button onClick={stop} className="rounded-full bg-white/70 px-5 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-100">Selesai</button>
        </div>
      )}

      {cycles >= 3 && phase === "idle" && (
        <p className="rounded-2xl bg-sky-50 p-4 text-center text-sm text-ink/70">
          Kamu udah napas pelan {cycles} siklus. Boleh dilanjut, boleh berhenti — keduanya cukup.
        </p>
      )}
    </div>
  );
}
