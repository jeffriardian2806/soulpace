"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveGameResultAction } from "@/app/main/saveResult";

type Dot = { id: number; label: string; type: "number" | "letter"; x: number; y: number };
type Mode = "intro" | "playing" | "done";
type Level = "A" | "B";

// === Dot generation ===
const VB_W = 360;
const VB_H = 540;
const PADDING = 32;
const MIN_DIST = 62; // jarak min antar dot supaya ga tabrakan

function generateDots(level: Level): Dot[] {
  const labels: { label: string; type: "number" | "letter" }[] = [];
  if (level === "A") {
    for (let i = 1; i <= 25; i++) labels.push({ label: String(i), type: "number" });
  } else {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    for (let i = 0; i < 13; i++) {
      labels.push({ label: String(i + 1), type: "number" });
      if (letters[i]) labels.push({ label: letters[i], type: "letter" });
    }
  }
  const placed: { x: number; y: number }[] = [];
  return labels.map((l, idx) => {
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 200; attempt++) {
      x = PADDING + Math.random() * (VB_W - 2 * PADDING);
      y = PADDING + Math.random() * (VB_H - 2 * PADDING);
      const ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) >= MIN_DIST);
      if (ok) break;
    }
    placed.push({ x, y });
    return { id: idx, label: l.label, type: l.type, x, y };
  });
}

// === Interpretation logic ===
function categorize(level: Level, timeSec: number, errors: number): { label: string; emoji: string; insight: string; tier: "great" | "good" | "ok" | "needs-practice" } {
  // Indonesian adult rough benchmarks:
  // TMT-A median ~30s, TMT-B median ~75s
  const fast = level === "A" ? 30 : 70;
  const slow = level === "A" ? 60 : 120;

  if (timeSec < fast && errors < 2) {
    return {
      tier: "great",
      emoji: "🎯",
      label: "Cepat & Akurat",
      insight: "Cognitive flexibility kamu di range tinggi. Otak responsif, switching atensi lancar. Pertahankan pola tidur & istirahat yang bikin kondisi ini.",
    };
  }
  if (timeSec < fast && errors >= 2) {
    return {
      tier: "ok",
      emoji: "⚡",
      label: "Cepat tapi Impulsif",
      insight: "Kamu cepat, tapi banyak salah klik. Style 'speed-first' bagus di situasi tekanan waktu, tapi mungkin perlu latih ketelitian di tugas yang butuh akurasi. Coba game Detektif Emosi atau Tantang Pikiran.",
    };
  }
  if (timeSec <= slow && errors < 2) {
    return {
      tier: "good",
      emoji: "✨",
      label: "Normal & Konsisten",
      insight: "Performa kamu di range normal yang sehat. Cognitive flexibility cukup, akurasi terjaga. Solid baseline.",
    };
  }
  if (timeSec <= slow && errors >= 2) {
    return {
      tier: "ok",
      emoji: "📚",
      label: "Normal, butuh ketelitian",
      insight: "Speed normal tapi salah klik agak banyak. Mungkin lagi capek atau terdistraksi? Coba ulang setelah istirahat singkat & lihat selisih hasilnya.",
    };
  }
  if (timeSec > slow && errors < 2) {
    return {
      tier: "good",
      emoji: "🧘",
      label: "Deliberatif & Teliti",
      insight: "Lambat tapi sangat akurat — style 'precision-first'. Bagus banget di tugas detail/perfeksi. Kalau di situasi cepat, latih juga decisiveness biar ga overthink.",
    };
  }
  return {
    tier: "needs-practice",
    emoji: "🌱",
    label: "Butuh Latih Atensi",
    insight: "Hasil kali ini menunjukkan attention switching masih perlu dilatih. Mungkin lagi capek, ngantuk, atau terdistraksi banget. Coba di waktu lain ketika lebih fresh — kalau pattern terus, refleksiin level stres/screen time kamu.",
  };
}

export function TrailGame() {
  const [mode, setMode] = useState<Mode>("intro");
  const [level, setLevel] = useState<Level>("A");
  const [dots, setDots] = useState<Dot[]>([]);
  const [tappedIds, setTappedIds] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [errorFlashId, setErrorFlashId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const savedRef = useRef(false);

  // Timer tick
  useEffect(() => {
    if (mode !== "playing" || !startTime) return;
    const t = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(t);
  }, [mode, startTime]);

  // Save result when done
  useEffect(() => {
    if (mode === "done" && !savedRef.current) {
      savedRef.current = true;
      const timeSec = Math.round(elapsed / 100) / 10;
      const cat = categorize(level, timeSec, errors);
      saveGameResultAction(
        "trail",
        {
          title: "Trail Making Test",
          headline: `${cat.emoji} ${cat.label}`,
          value: `${timeSec}s · ${errors} error`,
          secondary: `Level ${level}`,
          emoji: "🛤️",
        },
        { level, time_seconds: timeSec, errors, category: cat.tier, insight: cat.insight }
      );
    }
  }, [mode, elapsed, errors, level]);

  const startGame = (l: Level) => {
    setLevel(l);
    setDots(generateDots(l));
    setTappedIds([]);
    setErrors(0);
    setStartTime(Date.now());
    setElapsed(0);
    savedRef.current = false;
    setMode("playing");
  };

  const handleTap = (dotId: number) => {
    if (mode !== "playing") return;
    const expectedId = tappedIds.length;
    if (dotId === expectedId) {
      const newTapped = [...tappedIds, dotId];
      setTappedIds(newTapped);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(20);
      if (newTapped.length === dots.length) {
        setMode("done");
      }
    } else {
      setErrors((e) => e + 1);
      setErrorFlashId(dotId);
      setTimeout(() => setErrorFlashId(null), 400);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([30, 50, 30]);
    }
  };

  // === INTRO MODE ===
  if (mode === "intro") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-sky-500 to-emerald-500 p-6 text-white shadow-xl">
          <p className="text-4xl">🛤️</p>
          <p className="mt-2 text-lg font-bold">Trail Making Test</p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            Test penalaran klasik dari psikologi kognitif. Hubungin titik-titik berurutan — secepet & seakurat mungkin. Ngukur cognitive flexibility, atensi, dan kecepatan pemrosesan.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => startGame("A")}
            className="group rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 text-left ring-1 ring-sky-200 transition-all hover:from-sky-100 hover:to-purple-100 hover:ring-sky-400 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-sky-600">Level A · Pemula</p>
                <p className="mt-1 text-base font-bold text-ink">Connect 1 → 25 berurutan</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  25 titik bernomor. Tap urutan 1, 2, 3, ... 25. Ngukur visual scanning + motor.
                </p>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => startGame("B")}
            className="group rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 p-4 text-left ring-1 ring-rose-200 transition-all hover:from-rose-100 hover:to-amber-100 hover:ring-rose-400 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-rose-600">Level B · Lebih menantang</p>
                <p className="mt-1 text-base font-bold text-ink">Connect 1 → A → 2 → B → 3 → C ...</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  Selang-seling angka & huruf (1, A, 2, B, ... 13). Ngukur cognitive flexibility & set-shifting.
                </p>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        <p className="text-[10px] italic text-ink/45">
          Tip: nggak diukur perfect score — ngukur pattern atensi & kecepatan kamu hari ini. Lakuin di kondisi fresh.
        </p>
      </div>
    );
  }

  // === PLAYING MODE ===
  if (mode === "playing") {
    const next = dots[tappedIds.length];
    const timeSec = (elapsed / 1000).toFixed(1);
    return (
      <div className="flex flex-col gap-3">
        {/* HUD */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-50 to-purple-50 px-4 py-2 ring-1 ring-sky-100">
          <div className="text-xs">
            <span className="text-ink/55">Target:</span>{" "}
            <span className="text-base font-bold text-sky-700">{next?.label ?? "✓"}</span>
          </div>
          <div className="flex gap-3 text-xs">
            <span><span className="text-ink/55">⏱️</span> <span className="font-bold tabular-nums text-ink">{timeSec}s</span></span>
            <span><span className="text-ink/55">❌</span> <span className="font-bold text-rose-600">{errors}</span></span>
            <span><span className="text-ink/55">✓</span> <span className="font-bold text-emerald-600">{tappedIds.length}/{dots.length}</span></span>
          </div>
        </div>

        {/* SVG canvas */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-sky-50/50 to-purple-50/50 ring-1 ring-sky-100 shadow-inner">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto touch-manipulation" style={{ aspectRatio: `${VB_W}/${VB_H}` }}>
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Trail lines */}
            {tappedIds.slice(1).map((id, i) => {
              const from = dots[tappedIds[i]];
              const to = dots[id];
              return (
                <line
                  key={`line-${id}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="url(#lineGrad)" strokeWidth={4} strokeLinecap="round" opacity={0.8}
                />
              );
            })}

            {/* Dots */}
            {dots.map((d) => {
              const isTapped = tappedIds.includes(d.id);
              const isNext = d.id === tappedIds.length;
              const isError = errorFlashId === d.id;
              const fillColor = isError ? "#f43f5e" : isTapped ? "#10b981" : isNext ? "#fff" : "#fff";
              const strokeColor = isError ? "#9f1239" : isTapped ? "#047857" : isNext ? "#0ea5e9" : "#cbd5e1";
              const strokeWidth = isNext ? 3 : 2;
              const textColor = isError ? "#fff" : isTapped ? "#fff" : "#0f172a";
              const isLetter = d.type === "letter";
              return (
                <g
                  key={d.id}
                  onClick={() => handleTap(d.id)}
                  className={`cursor-pointer ${isError ? "animate-pulse" : isNext ? "" : ""}`}
                  style={{ touchAction: "manipulation" }}
                >
                  {/* Invisible larger hit area */}
                  <circle cx={d.x} cy={d.y} r={26} fill="transparent" />
                  {/* Glow for next target */}
                  {isNext && !isTapped && (
                    <circle cx={d.x} cy={d.y} r={22} fill="#0ea5e9" opacity={0.2} className="animate-ping" />
                  )}
                  <circle
                    cx={d.x} cy={d.y} r={isLetter ? 18 : 20}
                    fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth}
                    filter={isNext ? "url(#glow)" : undefined}
                    className={isNext ? "transition-all" : ""}
                  />
                  <text
                    x={d.x} y={d.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={isLetter ? 14 : 13}
                    fontWeight={700}
                    fill={textColor}
                    className="select-none pointer-events-none"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="text-center text-[10px] italic text-ink/45">
          Tap titik <strong>{next?.label}</strong> selanjutnya. Salah klik nambah error count.
        </p>
      </div>
    );
  }

  // === DONE MODE ===
  const timeSec = Math.round(elapsed / 100) / 10;
  const cat = categorize(level, timeSec, errors);
  const tierGradient = {
    great: "from-emerald-400 via-teal-400 to-sky-400",
    good: "from-sky-400 via-purple-400 to-emerald-400",
    ok: "from-amber-400 via-rose-400 to-purple-400",
    "needs-practice": "from-amber-400 via-orange-400 to-rose-400",
  }[cat.tier];

  return (
    <div className="flex flex-col gap-4">
      {/* Hero result */}
      <div className={`rounded-3xl bg-gradient-to-br ${tierGradient} p-6 text-white shadow-xl`}>
        <p className="text-5xl">{cat.emoji}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-white/80">Hasil — Level {level}</p>
        <p className="mt-1 text-2xl font-bold">{cat.label}</p>
        <div className="mt-3 flex gap-3 text-sm">
          <span>⏱️ <strong>{timeSec}s</strong></span>
          <span>·</span>
          <span>❌ <strong>{errors} error</strong></span>
        </div>
      </div>

      {/* Insight */}
      <section className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-ink/55">💡 Insight</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{cat.insight}</p>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setMode("intro"); savedRef.current = false; }}
          className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
        >
          🔄 Main lagi
        </button>
        <Link
          href="/profile"
          className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200"
        >
          Lihat profil →
        </Link>
      </div>

      <p className="text-[10px] italic text-ink/45 text-center">
        Hasil ini snapshot saat ini — performa bisa beda di waktu lain. Coba ulang besok pagi pas fresh buat compare.
      </p>
    </div>
  );
}
