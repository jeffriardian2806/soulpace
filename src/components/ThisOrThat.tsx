"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { thisOrThatInsight } from "@/core/lightContent";

export function ThisOrThat({ prompts }: { prompts: { a: string; b: string }[] }) {
  const [i, setI] = useState(0);
  const [bCount, setBCount] = useState(0);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(0); // -1..1 normalized horizontal drag
  const startX = useRef<number | null>(null);

  function pick(isB: boolean) {
    if (isB) setBCount((c) => c + 1);
    if (i + 1 >= prompts.length) setDone(true);
    else setI((x) => x + 1);
    setDrag(0);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    setDrag(Math.max(-1, Math.min(1, dx / 120)));
  }
  function onPointerUp() {
    if (startX.current === null) return;
    if (drag <= -0.6) pick(false);
    else if (drag >= 0.6) pick(true);
    else setDrag(0);
    startX.current = null;
  }

  if (done) {
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-2xl">🌙</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          {thisOrThatInsight(bCount, prompts.length)}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => { setI(0); setBCount(0); setDone(false); setDrag(0); }}
            className="rounded-full glass px-4 py-2 text-xs font-medium text-ink/70"
          >
            Ulangi
          </button>
          <Link href="/main" className="rounded-full px-4 py-2 text-xs font-medium text-ink/50">Selesai</Link>
        </div>
      </div>
    );
  }

  const c = prompts[i];
  const tilt = drag * 15; // tilt up to 15deg
  const opacity = 1 - Math.abs(drag) * 0.3;

  return (
    <div className="glass rounded-2xl p-5 select-none">
      <p className="mb-3 text-center text-xs text-ink/45">{i + 1}/{prompts.length}  pilih atau swipe</p>

      {/* Swipe area — kartu yang bisa di-drag horizontal */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mb-3 cursor-grab touch-none active:cursor-grabbing"
      >
        <div
          className="grid grid-cols-2 gap-3 transition-transform"
          style={{
            transform: `translateX(${drag * 30}px) rotate(${tilt * 0.3}deg)`,
            opacity,
          }}
        >
          <div
            className={`flex min-h-[140px] items-center justify-center rounded-2xl border-2 p-4 text-center text-sm font-medium transition-colors ${
              drag < -0.3 ? "border-sky-400 bg-sky-50 text-ink" : "border-sky-100 bg-white/70 text-ink/80"
            }`}
          >
            {c.a}
          </div>
          <div
            className={`flex min-h-[140px] items-center justify-center rounded-2xl border-2 p-4 text-center text-sm font-medium transition-colors ${
              drag > 0.3 ? "border-sky-400 bg-sky-50 text-ink" : "border-sky-100 bg-white/70 text-ink/80"
            }`}
          >
            {c.b}
          </div>
        </div>
        <div className="pointer-events-none mt-2 flex justify-between text-[10px] uppercase tracking-wide text-ink/30">
          <span>← swipe kiri</span>
          <span>swipe kanan →</span>
        </div>
      </div>

      {/* Tap fallback buat user yang prefer click */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => pick(false)}
          className="flex-1 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-ink/70 ring-1 ring-sky-100 hover:bg-sky-50"
        >
          Pilih kiri
        </button>
        <button
          type="button"
          onClick={() => pick(true)}
          className="flex-1 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-ink/70 ring-1 ring-sky-100 hover:bg-sky-50"
        >
          Pilih kanan
        </button>
      </div>
    </div>
  );
}
