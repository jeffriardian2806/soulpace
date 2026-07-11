"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type Content = {
  id?: string; kind: string; content_key: string; emoji: string | null;
  title: string | null; body: string | null; extra: Record<string, number> | null; sort_order: number;
};

type Mode = "companion" | "orb" | "hunt" | "butterfly";
const MODES: { key: Mode; icon: string; label: string }[] = [
  { key: "companion", icon: "🫧", label: "Napas" },
  { key: "orb", icon: "🎯", label: "Focus Orb" },
  { key: "hunt", icon: "⭐", label: "Memory Hunt" },
  { key: "butterfly", icon: "🦋", label: "Kupu Tenang" },
];

// ==== Utility ====
function pickRandom<T>(arr: T[]): T | null { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

export function WellbeingPlayer({ contents }: { contents: Content[] }) {
  const [mode, setMode] = useState<Mode>("companion");
  const byKind: Record<string, Content[]> = {};
  for (const c of contents) (byKind[c.kind] ??= []).push(c);
  for (const k of Object.keys(byKind)) byKind[k].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Latihan kecil buat nurunin tegang & latih fokus. Bukan pengganti terapi — tapi bisa jadi jeda sehat kapan aja.
      </div>

      {/* tab switcher — 4 mode, grid 4 kolom seragam */}
      <div className="grid grid-cols-4 gap-1.5">
        {MODES.map((mo) => (
          <button key={mo.key} onClick={() => setMode(mo.key)} className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition ${mode === mo.key ? "scale-105 bg-white shadow-md ring-2 ring-sky-400" : "bg-white/60 ring-1 ring-ink/10"}`}>
            <span className="text-xl">{mo.icon}</span>
            <span className="w-full truncate text-center text-[10px] font-medium text-ink/70">{mo.label}</span>
          </button>
        ))}
      </div>

      {mode === "companion" && <BreathingCompanion patterns={byKind["breath_pattern"] ?? []} />}
      {mode === "orb" && <FocusOrb messages={byKind["focus_message"] ?? []} />}
      {mode === "hunt" && <PositiveMemoryHunt words={byKind["balloon_word"] ?? []} />}
      {mode === "butterfly" && <ButterflyCalm words={byKind["balloon_word"] ?? []} />}

      <Link href="/main" className="w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-ink/70 ring-1 ring-ink/15">← Kembali</Link>
    </div>
  );
}

// ==== 1. Breathing Companion — bola cahaya, no camera ====
function BreathingCompanion({ patterns }: { patterns: Content[] }) {
  const [patternIdx, setPatternIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "holdOut" | "done">("inhale");
  const [cycleLeft, setCycleLeft] = useState(0);
  const [secLeft, setSecLeft] = useState(0);
  const runRef = useRef(false);

  const p = patterns[patternIdx];
  const ex = p?.extra ?? { inhale: 4, hold: 4, exhale: 4, holdOut: 0, cycles: 5 };

  useEffect(() => { runRef.current = running; }, [running]);
  useEffect(() => {
    if (!running) return;
    let cancel = false;
    (async () => {
      const cycles = ex.cycles ?? 5;
      for (let i = 0; i < cycles && runRef.current && !cancel; i++) {
        setCycleLeft(cycles - i);
        for (const ph of ["inhale", "hold", "exhale", "holdOut"] as const) {
          const dur = ex[ph] ?? 0;
          if (dur <= 0) continue;
          setPhase(ph);
          for (let s = dur; s > 0 && runRef.current && !cancel; s--) {
            setSecLeft(s);
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }
      if (!cancel) { setPhase("done"); setRunning(false); }
    })();
    return () => { cancel = true; };
  }, [running, patternIdx, ex]);

  if (!p) return <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">Belum ada pola napas. Minta admin isi dulu.</p>;

  // Ukuran bola sesuai phase
  const scale = phase === "inhale" ? 1.4 : phase === "exhale" ? 0.65 : phase === "hold" ? 1.4 : 0.65;
  const dur = ex[phase === "done" ? "inhale" : phase] ?? 4;
  const phaseLabel = phase === "inhale" ? "Tarik napas" : phase === "hold" ? "Tahan" : phase === "exhale" ? "Hembuskan" : phase === "holdOut" ? "Tahan kosong" : "Selesai";
  const phaseColor = phase === "inhale" ? "#60A5FA" : phase === "hold" ? "#A78BFA" : phase === "exhale" ? "#4ADE80" : phase === "holdOut" ? "#94A3B8" : "#FFD93D";

  return (
    <div className="flex flex-col gap-3">
      {/* Pilih pola */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {patterns.map((pt, i) => (
          <button key={pt.id ?? pt.content_key} onClick={() => { setPatternIdx(i); setRunning(false); setPhase("inhale"); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${i === patternIdx ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>
            {pt.emoji ?? ""} {pt.title}
          </button>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-ink/60">{p.body}</p>

      <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
        <div
          className="rounded-full transition-all ease-in-out"
          style={{
            width: "60%", height: "60%",
            transform: `scale(${scale})`,
            background: `radial-gradient(circle, ${phaseColor}CC 0%, ${phaseColor}44 60%, transparent 100%)`,
            boxShadow: `0 0 60px ${phaseColor}88`,
            transitionDuration: `${dur}s`,
          }}
        />
        <div className="absolute flex flex-col items-center text-center">
          <p className="text-sm font-bold text-ink">{phaseLabel}</p>
          {running && <p className="mt-1 text-4xl font-bold" style={{ color: phaseColor }}>{secLeft}</p>}
          {running && <p className="mt-1 text-xs text-ink/50">Siklus {cycleLeft} lagi</p>}
          {phase === "done" && <p className="mt-2 text-xs text-emerald-600">✓ Selesai. Napasmu lebih tenang.</p>}
        </div>
      </div>

      <button
        onClick={() => { if (running) { setRunning(false); } else { setPhase("inhale"); setRunning(true); } }}
        className={`rounded-full px-4 py-3 text-sm font-semibold text-white ${running ? "bg-rose-500" : "bg-sky-500"}`}
      >
        {running ? "⏸ Stop" : phase === "done" ? "🔄 Ulangi" : "▶ Mulai"}
      </button>
    </div>
  );
}

// ==== 2. Focus Orb — orb bergerak, user pandangin pakai face tracking ====
function FocusOrb({ messages }: { messages: Content[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [err, setErr] = useState("");
  const [focusSec, setFocusSec] = useState(0);
  const [message, setMessage] = useState<Content | null>(null);
  const rafRef = useRef<number | null>(null);
  const faceRef = useRef<unknown>(null);
  const runningRef = useRef(false);
  const orbRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });
  const startedAtRef = useRef(0);
  const lastMessageAtRef = useRef(0);

  const start = async () => {
    setStatus("loading"); setErr(""); setFocusSec(0); setMessage(null);
    try {
      const vision = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs" as string
      );
      const { FaceLandmarker, FilesetResolver } = vision as { FaceLandmarker: { createFromOptions: (r: unknown, o: unknown) => Promise<unknown> }; FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> } };
      const resolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
      const opts = (d: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: d },
        outputFaceBlendshapes: true, runningMode: "VIDEO" as const, numFaces: 1,
      });
      try { faceRef.current = await FaceLandmarker.createFromOptions(resolver, opts("GPU")); }
      catch { faceRef.current = await FaceLandmarker.createFromOptions(resolver, opts("CPU")); }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 640 }, audio: false });
      const v = videoRef.current!; v.srcObject = stream; await v.play();
      if (!v.videoWidth) await new Promise<void>((res) => { v.onloadedmetadata = () => res(); });
      runningRef.current = true; startedAtRef.current = performance.now(); lastMessageAtRef.current = 0;
      setStatus("running"); loop();
    } catch (e) { console.error(e); setStatus("error"); setErr("Gagal buka kamera. Kasih izin & pakai Chrome terbaru + internet."); }
  };

  const loop = () => {
    const canvas = canvasRef.current;
    const face = faceRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] } } | null;
    if (!canvas || !face || !videoRef.current) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 480; canvas.height = 640;

    const render = () => {
      if (!runningRef.current) return;
      const v = videoRef.current!;
      if (v.readyState < 2) { rafRef.current = requestAnimationFrame(render); return; }
      const now = performance.now();

      // Background gradient tenang
      const bg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.height);
      bg.addColorStop(0, "#1e3a8a"); bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Orb pindah target tiap ~5 detik
      const t = now / 1000;
      const targetShift = Math.floor(t / 5);
      const rng = mulberry32(targetShift);
      orbRef.current.tx = 0.2 + rng() * 0.6;
      orbRef.current.ty = 0.2 + rng() * 0.6;
      // smooth follow
      orbRef.current.x += (orbRef.current.tx - orbRef.current.x) * 0.02;
      orbRef.current.y += (orbRef.current.ty - orbRef.current.y) * 0.02;
      const ox = orbRef.current.x * canvas.width;
      const oy = orbRef.current.y * canvas.height;

      // Deteksi gaze
      let looking = false;
      try {
        const res = face.detectForVideo(v, now);
        if (res.faceBlendshapes && res.faceBlendshapes.length > 0) {
          const bs: Record<string, number> = {};
          for (const c of res.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
          const gazeX = ((bs.eyeLookInRight ?? 0) - (bs.eyeLookOutRight ?? 0)) + ((bs.eyeLookOutLeft ?? 0) - (bs.eyeLookInLeft ?? 0));
          const gazeY = ((bs.eyeLookUpLeft ?? 0) + (bs.eyeLookUpRight ?? 0)) / 2 - ((bs.eyeLookDownLeft ?? 0) + (bs.eyeLookDownRight ?? 0)) / 2;
          // relatif: orb di posisi X? user gaze harus ngarah ke X
          const targetGazeX = (orbRef.current.x - 0.5) * 2;
          const targetGazeY = -(orbRef.current.y - 0.5) * 2;
          const dist = Math.hypot(gazeX - targetGazeX * 0.4, gazeY - targetGazeY * 0.4);
          looking = dist < 0.35;
        }
      } catch { /* skip */ }

      // Update focusSec (per 100ms tick approx via raf)
      if (looking) setFocusSec((s) => s + 1 / 60);

      // Draw orb
      const pulse = 1 + Math.sin(t * 2) * 0.1;
      const orbColor = looking ? "#4ADE80" : "#F59E0B";
      const orbGlow = looking ? "#A7F3D0" : "#FDE68A";
      ctx.beginPath();
      const grad = ctx.createRadialGradient(ox, oy, 5, ox, oy, 60 * pulse);
      grad.addColorStop(0, orbColor); grad.addColorStop(0.4, orbGlow + "AA"); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.arc(ox, oy, 60 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ox, oy, 8, 0, Math.PI * 2); ctx.fill();

      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  // Munculin message tiap 15 detik fokus akumulatif
  useEffect(() => {
    if (focusSec > 0 && Math.floor(focusSec) > 0 && Math.floor(focusSec) % 15 === 0) {
      const now = Date.now();
      if (now - lastMessageAtRef.current > 5000) {
        lastMessageAtRef.current = now;
        setMessage(pickRandom(messages));
      }
    }
  }, [focusSec, messages]);

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v?.srcObject) { (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); v.srcObject = null; }
    setStatus("idle");
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink/60">Orb bergerak pelan. Fokusin mata ke orb — pas kamu tetap fokus, orb jadi hijau. Latihan pandangan yang tenang.</p>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/95" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />
        {status === "running" && (
          <div className="absolute left-3 top-3 rounded-xl bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">
            Fokus: <b>{Math.floor(focusSec)}s</b>
          </div>
        )}
        {status === "idle" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>🎯 Tap mulai buat latihan fokus</p></div>}
        {status === "loading" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>Menyiapkan kamera...</p></div>}
      </div>

      {message && (
        <div className="rounded-2xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
          <p className="text-lg">{message.emoji}</p>
          <p className="mt-1 text-sm italic text-emerald-800">&ldquo;{message.body}&rdquo;</p>
        </div>
      )}

      {status === "error" && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">⚠️ {err}</p>}

      {status === "running" ? (
        <button onClick={stop} className="rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white">⏸ Stop</button>
      ) : (
        <button onClick={start} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">🎯 Mulai Focus Orb</button>
      )}
    </div>
  );
}
function mulberry32(a: number) { return function () { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ==== 3. Positive Memory Hunt — bintang muncul di kamera, tap → affirmasi ====
function PositiveMemoryHunt({ words }: { words: Content[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [err, setErr] = useState("");
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([]);
  const [reward, setReward] = useState<Content | null>(null);
  const [score, setScore] = useState(0);
  const nextIdRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    setStatus("loading"); setErr(""); setScore(0); setStars([]); setReward(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 480, height: 640 }, audio: false });
      const v = videoRef.current!; v.srcObject = stream; await v.play();
      setStatus("running");
      spawnRef.current = setInterval(() => {
        setStars((s) => {
          if (s.length >= 5) return s;
          return [...s, { id: nextIdRef.current++, x: 10 + Math.random() * 80, y: 10 + Math.random() * 70 }];
        });
      }, 1500);
    } catch (e) { console.error(e); setStatus("error"); setErr("Gagal buka kamera belakang."); }
  };

  const stop = () => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    const v = videoRef.current;
    if (v?.srcObject) { (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); v.srcObject = null; }
    setStatus("idle");
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const catchStar = (id: number) => {
    setStars((s) => s.filter((x) => x.id !== id));
    setScore((n) => n + 1);
    setReward(pickRandom(words));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink/60">Arahin kamera ke sekitarmu. Bintang bakal muncul acak — tap tiap bintang buat dapetin kata positif.</p>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/95" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {status === "running" && stars.map((s) => (
          <button key={s.id} onClick={() => catchStar(s.id)} className="absolute animate-pulse text-3xl drop-shadow-lg" style={{ left: `${s.x}%`, top: `${s.y}%` }}>⭐</button>
        ))}
        {status === "running" && (
          <div className="absolute left-3 top-3 rounded-xl bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">Terkumpul: <b>{score}</b></div>
        )}
        {status === "idle" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>⭐ Tap mulai buat hunt</p></div>}
        {status === "loading" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>Menyiapkan kamera...</p></div>}
      </div>

      {reward && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center ring-1 ring-amber-200">
          <p className="text-3xl">{reward.emoji}</p>
          <p className="mt-1 text-xl font-bold text-amber-800">{reward.body}</p>
          <p className="mt-1 text-[11px] italic text-ink/55">Bawa kata ini seharian.</p>
        </div>
      )}

      {status === "error" && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">⚠️ {err}</p>}

      {status === "running" ? (
        <button onClick={stop} className="rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white">⏸ Stop</button>
      ) : (
        <button onClick={start} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">⭐ Mulai Memory Hunt</button>
      )}
    </div>
  );
}

// ==== 4. Butterfly Calm — kupu terbang, tap → affirmasi ====
function ButterflyCalm({ words }: { words: Content[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [err, setErr] = useState("");
  const [butterflies, setButterflies] = useState<{ id: number; x: number; y: number; vx: number; vy: number; rot: number }[]>([]);
  const [reward, setReward] = useState<Content | null>(null);
  const nextIdRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    setStatus("loading"); setErr(""); setButterflies([]); setReward(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 480, height: 640 }, audio: false });
      const v = videoRef.current!; v.srcObject = stream; await v.play();
      setStatus("running");
      spawnRef.current = setInterval(() => {
        setButterflies((b) => {
          if (b.length >= 6) return b;
          return [...b, {
            id: nextIdRef.current++,
            x: Math.random() * 80 + 10, y: Math.random() * 70 + 10,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            rot: Math.random() * 30 - 15,
          }];
        });
      }, 2000);
      moveRef.current = setInterval(() => {
        setButterflies((arr) => arr.map((b) => {
          let nx = b.x + b.vx, ny = b.y + b.vy, nvx = b.vx, nvy = b.vy;
          if (nx < 5 || nx > 90) nvx = -nvx;
          if (ny < 5 || ny > 85) nvy = -nvy;
          if (Math.random() < 0.02) { nvx = (Math.random() - 0.5) * 0.4; nvy = (Math.random() - 0.5) * 0.4; }
          return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
        }));
      }, 80);
    } catch (e) { console.error(e); setStatus("error"); setErr("Gagal buka kamera."); }
  };

  const stop = () => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (moveRef.current) clearInterval(moveRef.current);
    const v = videoRef.current;
    if (v?.srcObject) { (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); v.srcObject = null; }
    setStatus("idle");
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const catchButterfly = (id: number) => {
    setButterflies((b) => b.filter((x) => x.id !== id));
    setReward(pickRandom(words));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink/60">Kupu-kupu tenang beterbangan. Tap pelan buat dapetin kata damai. Nggak buru-buru, biarin terbang aja juga boleh.</p>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/95" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {status === "running" && butterflies.map((b) => (
          <button key={b.id} onClick={() => catchButterfly(b.id)} className="absolute text-3xl drop-shadow-lg transition-transform" style={{ left: `${b.x}%`, top: `${b.y}%`, transform: `rotate(${b.rot}deg)` }}>🦋</button>
        ))}
        {status === "idle" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>🦋 Tap mulai</p></div>}
        {status === "loading" && <div className="absolute inset-0 flex items-center justify-center text-white/70"><p>Menyiapkan...</p></div>}
      </div>

      {reward && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 text-center ring-1 ring-sky-200">
          <p className="text-3xl">{reward.emoji}</p>
          <p className="mt-1 text-xl font-bold text-sky-800">{reward.body}</p>
        </div>
      )}

      {status === "error" && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">⚠️ {err}</p>}

      {status === "running" ? (
        <button onClick={stop} className="rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white">⏸ Stop</button>
      ) : (
        <button onClick={start} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">🦋 Mulai Kupu Tenang</button>
      )}
    </div>
  );
}
