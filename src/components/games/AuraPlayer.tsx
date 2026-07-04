"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number };

export function AuraPlayer({ moods }: { moods: AuraMood[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [aura, setAura] = useState<AuraMood | null>(null);
  const [locked, setLocked] = useState<AuraMood | null>(null);
  const [mode, setMode] = useState<"mystic" | "particle">("mystic");

  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const runningRef = useRef(false);
  const modeRef = useRef(mode);
  const auraRef = useRef<AuraMood | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const moodMap = useRef<Record<string, AuraMood>>({});

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    const m: Record<string, AuraMood> = {};
    for (const x of moods) m[x.mood_key] = x;
    moodMap.current = m;
  }, [moods]);

  const start = async () => {
    setStatus("loading");
    setErrorMsg("");
    setLocked(null);
    try {
      const vision = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs" as string
      );
      const { FaceLandmarker, FilesetResolver } = vision as {
        FaceLandmarker: { createFromOptions: (r: unknown, o: unknown) => Promise<unknown> };
        FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> };
      };
      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const opts = (delegate: "GPU" | "CPU") => ({
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate,
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO" as const,
        numFaces: 1,
      });
      let landmarker;
      try { landmarker = await FaceLandmarker.createFromOptions(resolver, opts("GPU")); }
      catch { landmarker = await FaceLandmarker.createFromOptions(resolver, opts("CPU")); }
      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 640 }, audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (!video.videoWidth) {
        await new Promise<void>((res) => { video.onloadedmetadata = () => res(); });
      }
      runningRef.current = true;
      setStatus("running");
      loop();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("Gagal buka kamera atau muat AR. Pastikan kasih izin kamera & pakai Chrome terbaru + koneksi internet.");
    }
  };

  const spawnParticles = (w: number, h: number, kind: string) => {
    const arr = particlesRef.current;
    if (arr.length > 60) return;
    const rise = ["fire", "spark", "star", "sparkle"].includes(kind);
    arr.push({
      x: Math.random() * w,
      y: rise ? h + 10 : -10,
      vx: (Math.random() - 0.5) * 1.2,
      vy: rise ? -(1 + Math.random() * 2) : (1 + Math.random() * 2),
      life: 1,
      size: 3 + Math.random() * 5,
    });
  };

  const loop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current as {
      detectForVideo: (v: HTMLVideoElement, t: number) => { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] };
    } | null;
    if (!video || !canvas || !lm) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;

    const render = () => {
      if (!runningRef.current || !videoRef.current) return;
      const v = videoRef.current;
      if (v.readyState < 2 || !v.videoWidth) { rafRef.current = requestAnimationFrame(render); return; }

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      let res: { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] } | null = null;
      try { res = lm.detectForVideo(v, performance.now()); } catch { res = null; }

      if (res?.faceBlendshapes && res.faceBlendshapes.length > 0) {
        const bs: Record<string, number> = {};
        for (const c of res.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
        const key = classifyMood(bs);
        const a = moodMap.current[key] ?? moodMap.current["neutral"];
        if (a) {
          auraRef.current = a;
          setAura(a);

          const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.15,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.6
          );
          grad.addColorStop(0, "transparent");
          grad.addColorStop(1, a.glow + "AA");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.strokeStyle = a.color;
          ctx.lineWidth = 12;
          ctx.shadowColor = a.color;
          ctx.shadowBlur = 30;
          ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
          ctx.shadowBlur = 0;

          if (modeRef.current === "particle") {
            spawnParticles(canvas.width, canvas.height, a.particle);
            const arr = particlesRef.current;
            for (let i = arr.length - 1; i >= 0; i--) {
              const p = arr[i];
              p.x += p.vx; p.y += p.vy; p.life -= 0.012;
              if (p.life <= 0) { arr.splice(i, 1); continue; }
              ctx.globalAlpha = Math.max(0, p.life);
              ctx.fillStyle = a.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          } else {
            particlesRef.current = [];
          }
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const lockAura = () => { if (auraRef.current) setLocked(auraRef.current); };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    particlesRef.current = [];
    setStatus("idle");
    setAura(null);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Fitur hiburan, bukan pemeriksaan psikologi. Warna aura cuma seru-seruan ngebaca ekspresi wajah kamu.
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/90" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />

        {status === "running" && (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              onClick={() => setMode("mystic")}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${mode === "mystic" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-purple-400" : "bg-black/30 text-white/70"}`}
              title="Mode Mistis"
            >🔮</button>
            <button
              onClick={() => setMode("particle")}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${mode === "particle" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-sky-400" : "bg-black/30 text-white/70"}`}
              title="Mode Elemen Bergerak"
            >✨</button>
          </div>
        )}

        {status === "running" && aura && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 text-center">
            <span className="text-lg">{aura.emoji}</span>
            <span className="ml-2 font-bold" style={{ color: aura.glow }}>Aura {aura.label}</span>
            {mode === "mystic" && (
              <p className="mt-2 text-xs italic leading-relaxed text-white/90">
                &ldquo;{aura.desc_mystic}&rdquo;
              </p>
            )}
          </div>
        )}

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <span className="text-5xl">🔮</span>
            <p className="text-sm">Tap mulai buat cek aura kamu</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <span className="animate-pulse text-4xl">✨</span>
            <p className="text-sm">Menyiapkan AR...</p>
          </div>
        )}
      </div>

      {locked && (
        <div className="rounded-2xl p-5 text-center ring-2" style={{ background: `linear-gradient(160deg, ${locked.glow}33, ${locked.glow}11)`, borderColor: locked.color }}>
          <p className="text-4xl">{locked.emoji}</p>
          <p className="mt-1 text-xl font-bold" style={{ color: locked.color }}>Aura {locked.label}</p>
          {mode === "mystic" ? (
            <p className="mt-2 text-sm italic leading-relaxed text-ink/75">&ldquo;{locked.desc_mystic}&rdquo;</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{locked.desc_short}</p>
          )}
          <p className="mt-3 text-[11px] text-ink/45">Flouwell · Cek Aura AR · {today}</p>
        </div>
      )}

      {status === "error" && (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {errorMsg}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {status === "idle" || status === "error" ? (
          <button onClick={start} className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">🔮 Mulai Cek Aura</button>
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
