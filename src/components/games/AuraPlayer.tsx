"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveAuraSnapshot } from "@/app/main/aura/saveAura";

export type AuraMood = {
  mood_key: string;
  emoji: string;
  label: string;
  color: string;
  glow: string;
  particle: string;
  desc_short: string;
  desc_mystic: string;
};

function classifyMood(bs: Record<string, number>): string {
  const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
  const frown = ((bs.mouthFrownLeft ?? 0) + (bs.mouthFrownRight ?? 0)) / 2;
  const browDown = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
  const browUp = bs.browInnerUp ?? 0;
  const jawOpen = bs.jawOpen ?? 0;
  const eyeSquint = ((bs.eyeSquintLeft ?? 0) + (bs.eyeSquintRight ?? 0)) / 2;
  const eyeWide = ((bs.eyeWideLeft ?? 0) + (bs.eyeWideRight ?? 0)) / 2;
  const eyeBlink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
  const noseSneer = ((bs.noseSneerLeft ?? 0) + (bs.noseSneerRight ?? 0)) / 2;
  const upperLip = ((bs.mouthUpperUpLeft ?? 0) + (bs.mouthUpperUpRight ?? 0)) / 2;

  if (noseSneer > 0.3 || upperLip > 0.4) return "disgust";
  if (jawOpen > 0.45 && smile > 0.3) return "joyful";
  if (jawOpen > 0.5 && browUp > 0.4 && smile < 0.2) return "surprised";
  if (eyeWide > 0.4 && browUp > 0.35 && smile < 0.15) return "fear";
  if (browDown > 0.4 && smile < 0.15) return "angry";
  if (smile > 0.35) return "happy";
  if (frown > 0.2 || (browUp > 0.3 && smile < 0.1)) return "sad";
  if (eyeBlink > 0.5 || (eyeSquint > 0.45 && smile < 0.15)) return "tired";
  if (browDown > 0.2 && eyeSquint > 0.25 && smile < 0.1) return "focused";
  return "neutral";
}

// Energy 0-100 dari ekspresi (senyum/mata segar tinggi, ngantuk/sedih rendah)
function calcEnergy(bs: Record<string, number>): number {
  const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
  const eyeBlink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
  const eyeWide = ((bs.eyeWideLeft ?? 0) + (bs.eyeWideRight ?? 0)) / 2;
  let e = 50 + smile * 40 + eyeWide * 20 - eyeBlink * 45;
  return Math.max(5, Math.min(100, Math.round(e)));
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number };
type Mode = "self" | "scan";

export function AuraPlayer({ moods }: { moods: AuraMood[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [aura, setAura] = useState<AuraMood | null>(null);
  const [energy, setEnergy] = useState(0);
  const [bodySignal, setBodySignal] = useState("—");
  const [effect, setEffect] = useState<"mystic" | "particle">("mystic");
  const [mode, setMode] = useState<Mode>("self");
  const [locked, setLocked] = useState<null | { aura: AuraMood; energy: number; body: string }>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const rafRef = useRef<number | null>(null);
  const faceRef = useRef<unknown>(null);
  const poseRef = useRef<unknown>(null);
  const runningRef = useRef(false);
  const effectRef = useRef(effect);
  const auraRef = useRef<AuraMood | null>(null);
  const energyRef = useRef(0);
  const bodyRef = useRef("—");
  const particlesRef = useRef<Particle[]>([]);
  const moodMap = useRef<Record<string, AuraMood>>({});

  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => {
    const m: Record<string, AuraMood> = {};
    for (const x of moods) m[x.mood_key] = x;
    moodMap.current = m;
  }, [moods]);

  const start = async () => {
    setStatus("loading"); setErrorMsg(""); setLocked(null); setSaveState("idle");
    try {
      const vision = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs" as string
      );
      const { FaceLandmarker, PoseLandmarker, FilesetResolver } = vision as {
        FaceLandmarker: { createFromOptions: (r: unknown, o: unknown) => Promise<unknown> };
        PoseLandmarker: { createFromOptions: (r: unknown, o: unknown) => Promise<unknown> };
        FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> };
      };
      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const faceOpts = (d: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: d },
        outputFaceBlendshapes: true, runningMode: "VIDEO" as const, numFaces: 1,
      });
      const poseOpts = (d: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate: d },
        runningMode: "VIDEO" as const, numPoses: 1,
      });
      try { faceRef.current = await FaceLandmarker.createFromOptions(resolver, faceOpts("GPU")); }
      catch { faceRef.current = await FaceLandmarker.createFromOptions(resolver, faceOpts("CPU")); }
      try { poseRef.current = await PoseLandmarker.createFromOptions(resolver, poseOpts("GPU")); }
      catch { try { poseRef.current = await PoseLandmarker.createFromOptions(resolver, poseOpts("CPU")); } catch { poseRef.current = null; } }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode === "self" ? "user" : "environment", width: 480, height: 640 }, audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (!video.videoWidth) await new Promise<void>((res) => { video.onloadedmetadata = () => res(); });
      runningRef.current = true;
      setStatus("running");
      loop();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("Gagal buka kamera / muat AR. Kasih izin kamera & pakai Chrome terbaru + internet.");
    }
  };

  const spawn = (w: number, h: number, kind: string) => {
    const arr = particlesRef.current;
    if (arr.length > 60) return;
    const rise = ["fire", "spark", "star", "sparkle"].includes(kind);
    arr.push({ x: Math.random() * w, y: rise ? h + 10 : -10, vx: (Math.random() - 0.5) * 1.2, vy: rise ? -(1 + Math.random() * 2) : (1 + Math.random() * 2), life: 1, size: 3 + Math.random() * 5 });
  };

  const loop = () => {
    const canvas = canvasRef.current;
    const face = faceRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] } } | null;
    const pose = poseRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks?: { x: number; y: number; z: number }[][] } } | null;
    if (!videoRef.current || !canvas || !face) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 640;

    const render = () => {
      if (!runningRef.current || !videoRef.current) return;
      const v = videoRef.current;
      if (v.readyState < 2 || !v.videoWidth) { rafRef.current = requestAnimationFrame(render); return; }
      const now = performance.now();

      ctx.save(); ctx.scale(-1, 1);
      ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      let fres: { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] } | null = null;
      try { fres = face.detectForVideo(v, now); } catch { fres = null; }

      // POSE → body signal
      if (pose) {
        try {
          const pres = pose.detectForVideo(v, now);
          if (pres?.landmarks && pres.landmarks.length > 0) {
            const lm = pres.landmarks[0];
            // 11 = shoulder kiri, 12 = kanan, 0 = hidung
            const ls = lm[11], rs = lm[12], nose = lm[0];
            if (ls && rs && nose) {
              const shoulderTilt = Math.abs(ls.y - rs.y);
              const shoulderMidY = (ls.y + rs.y) / 2;
              const neckDrop = shoulderMidY - nose.y; // makin kecil = kepala nunduk/dekat bahu
              let sig = "good posture";
              if (shoulderTilt > 0.06) sig = "uneven posture";
              else if (neckDrop < 0.18) sig = "low posture confidence";
              else if (shoulderMidY > 0.75) sig = "slouching / tired posture";
              else sig = "confident posture";
              bodyRef.current = sig;
              setBodySignal(sig);
            }
          }
        } catch { /* skip */ }
      } else {
        bodyRef.current = "posture n/a";
      }

      if (fres?.faceBlendshapes && fres.faceBlendshapes.length > 0) {
        const bs: Record<string, number> = {};
        for (const c of fres.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
        const key = classifyMood(bs);
        const a = moodMap.current[key] ?? moodMap.current["neutral"];
        const e = calcEnergy(bs);
        if (a) {
          auraRef.current = a; energyRef.current = e;
          setAura(a); setEnergy(e);

          const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.15, canvas.width / 2, canvas.height / 2, canvas.height * 0.6);
          grad.addColorStop(0, "transparent"); grad.addColorStop(1, a.glow + "AA");
          ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = a.color; ctx.lineWidth = 12; ctx.shadowColor = a.color; ctx.shadowBlur = 30;
          ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12); ctx.shadowBlur = 0;

          if (effectRef.current === "particle") {
            spawn(canvas.width, canvas.height, a.particle);
            const arr = particlesRef.current;
            for (let i = arr.length - 1; i >= 0; i--) {
              const p = arr[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
              if (p.life <= 0) { arr.splice(i, 1); continue; }
              ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = a.color;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
          } else particlesRef.current = [];
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const lockAura = () => {
    if (auraRef.current) setLocked({ aura: auraRef.current, energy: energyRef.current, body: bodyRef.current });
  };

  const save = async () => {
    if (!locked) return;
    setSaveState("saving");
    const r = await saveAuraSnapshot({
      mood_key: locked.aura.mood_key,
      aura_label: locked.aura.label,
      mood_text: locked.aura.desc_short,
      energy: locked.energy,
      body_signal: locked.body,
    });
    setSaveState(r.error ? "error" : "saved");
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video?.srcObject) { (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); video.srcObject = null; }
    particlesRef.current = [];
    setStatus("idle"); setAura(null);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Fitur hiburan, bukan pemeriksaan psikologi. {mode === "scan" && "Mode Scan Orang cuma buat seru-seruan, hasilnya nggak disimpan."}
      </div>

      {/* Mode pilih: Cek Diri / Scan Orang */}
      {status === "idle" && (
        <div className="flex gap-2">
          <button onClick={() => setMode("self")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${mode === "self" ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>🙂 Cek Diri</button>
          <button onClick={() => setMode("scan")} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${mode === "scan" ? "bg-purple-500 text-white ring-purple-500" : "bg-white text-ink/60 ring-ink/15"}`}>👁️ Scan Orang</button>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/90" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />

        {/* toggle efek */}
        {status === "running" && (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button onClick={() => setEffect("mystic")} className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${effect === "mystic" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-purple-400" : "bg-black/30 text-white/70"}`} title="Mistis">🔮</button>
            <button onClick={() => setEffect("particle")} className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${effect === "particle" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-sky-400" : "bg-black/30 text-white/70"}`} title="Elemen Bergerak">✨</button>
          </div>
        )}

        {/* SCOUTER panel kiri atas */}
        {status === "running" && aura && (
          <div className="absolute left-3 top-3 rounded-xl bg-black/55 p-2.5 text-left backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/50">Today's Aura</p>
            <p className="text-sm font-bold" style={{ color: aura.glow }}>{aura.label}</p>
            <p className="mt-1 text-[10px] text-white/70">Mood: {aura.desc_short}</p>
            <p className="text-[10px] text-white/70">Energy: {energy}%</p>
            <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full" style={{ width: `${energy}%`, background: aura.color }} />
            </div>
            <p className="mt-1 text-[10px] text-white/70">Body: {bodySignal}</p>
          </div>
        )}

        {/* teks mistis live */}
        {status === "running" && aura && effect === "mystic" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 text-center">
            <span className="text-lg">{aura.emoji}</span>
            <span className="ml-2 font-bold" style={{ color: aura.glow }}>Aura {aura.label}</span>
            <p className="mt-2 text-xs italic leading-relaxed text-white/90">&ldquo;{aura.desc_mystic}&rdquo;</p>
          </div>
        )}

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <span className="text-5xl">🔮</span>
            <p className="text-sm">{mode === "self" ? "Tap mulai buat cek aura kamu" : "Arahin ke orang lain, tap mulai"}</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <span className="animate-pulse text-4xl">✨</span>
            <p className="text-sm">Menyiapkan AR...</p>
          </div>
        )}
      </div>

      {/* Kartu hasil (share) */}
      {locked && (
        <div className="rounded-2xl p-5 text-center ring-2" style={{ background: `linear-gradient(160deg, ${locked.aura.glow}33, ${locked.aura.glow}11)`, borderColor: locked.aura.color }}>
          <p className="text-4xl">{locked.aura.emoji}</p>
          <p className="mt-1 text-xl font-bold" style={{ color: locked.aura.color }}>Today's Aura: {locked.aura.label}</p>
          <div className="mt-2 space-y-0.5 text-sm text-ink/75">
            <p>Mood: <b>{locked.aura.desc_short}</b></p>
            <p>Energy: <b>{locked.energy}%</b></p>
            <p>Body Signal: <b>{locked.body}</b></p>
          </div>
          {effect === "mystic" && <p className="mt-2 text-xs italic leading-relaxed text-ink/65">&ldquo;{locked.aura.desc_mystic}&rdquo;</p>}
          <p className="mt-3 text-[11px] text-ink/45">Flouwell · Cek Aura AR · {today}</p>

          {mode === "self" && (
            <div className="mt-3">
              {saveState === "saved" ? (
                <p className="text-xs font-semibold text-emerald-600">✓ Tersimpan ke riwayat kamu</p>
              ) : (
                <button onClick={save} disabled={saveState === "saving"} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  {saveState === "saving" ? "Menyimpan..." : "💾 Simpan ke Riwayat"}
                </button>
              )}
              {saveState === "error" && <p className="mt-1 text-xs text-rose-600">Gagal simpan. Coba lagi.</p>}
            </div>
          )}
          {mode === "scan" && <p className="mt-3 text-[11px] italic text-ink/45">Mode scan orang — hasil nggak disimpan.</p>}
        </div>
      )}

      {status === "error" && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {errorMsg}</p>}

      <div className="flex flex-wrap gap-2">
        {status === "idle" || status === "error" ? (
          <button onClick={start} className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">🔮 Mulai {mode === "self" ? "Cek Diri" : "Scan Orang"}</button>
        ) : (
          <>
            <button onClick={lockAura} className="flex-1 rounded-full bg-purple-500 px-4 py-3 text-sm font-semibold text-white">🔒 Kunci Aura</button>
            <button onClick={stop} className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Stop</button>
          </>
        )}
        <Link href="/main" className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Kembali</Link>
      </div>
    </div>
  );
}
