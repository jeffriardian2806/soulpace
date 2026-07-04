"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ==== Mood → Aura mapping (HIBURAN, bukan klaim psikologi) ====
type Aura = { mood: string; label: string; color: string; glow: string; desc: string; emoji: string };

const AURAS: Record<string, Aura> = {
  happy:    { mood: "happy",    label: "Kuning Emas", color: "#FFD93D", glow: "#FFE98A", emoji: "😄", desc: "Aura ceria & penuh energi positif. Vibe kamu lagi cerah!" },
  neutral:  { mood: "neutral",  label: "Hijau Tenang", color: "#4ADE80", glow: "#A7F3C9", emoji: "😌", desc: "Aura seimbang & kalem. Kamu lagi di mode stabil." },
  sad:      { mood: "sad",      label: "Biru Laut",    color: "#60A5FA", glow: "#A5C8FF", emoji: "😢", desc: "Aura biru yang dalam & reflektif. Nggak apa-apa pelan-pelan." },
  angry:    { mood: "angry",    label: "Merah Api",    color: "#F87171", glow: "#FCA5A5", emoji: "😠", desc: "Aura merah menyala. Ada energi kuat yang lagi kamu tahan." },
  surprised:{ mood: "surprised",label: "Ungu Kejut",   color: "#C084FC", glow: "#DDB6FF", emoji: "😲", desc: "Aura ungu elektrik. Kamu lagi kaget atau penasaran!" },
};

// Klasifikasi ekspresi sederhana dari blendshapes MediaPipe → mood
function classifyMood(bs: Record<string, number>): string {
  const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
  const frown = ((bs.mouthFrownLeft ?? 0) + (bs.mouthFrownRight ?? 0)) / 2;
  const browDown = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
  const jawOpen = bs.jawOpen ?? 0;
  const browUp = bs.browInnerUp ?? 0;

  if (jawOpen > 0.5 && browUp > 0.4) return "surprised";
  if (browDown > 0.4 && smile < 0.15) return "angry";
  if (smile > 0.35) return "happy";
  if (frown > 0.2 || (browUp > 0.3 && smile < 0.1)) return "sad";
  return "neutral";
}

export function AuraPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [aura, setAura] = useState<Aura | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<unknown>(null);

  const start = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      // Load MediaPipe FaceLandmarker dari CDN (no npm dep)
      const vision = await import(
        /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs" as string
      );
      const { FaceLandmarker, FilesetResolver } = vision as {
        FaceLandmarker: {
          createFromOptions: (r: unknown, o: unknown) => Promise<unknown>;
        };
        FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> };
      };

      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 640 },
        audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus("running");
      loop();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg(
        "Gagal buka kamera atau muat AR. Pastikan kasih izin kamera & pakai browser Chrome terbaru."
      );
    }
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
      if (!videoRef.current || status === "idle") return;
      const now = performance.now();
      const res = lm.detectForVideo(video, now);

      // gambar video (mirror)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (res.faceBlendshapes && res.faceBlendshapes.length > 0) {
        const bs: Record<string, number> = {};
        for (const c of res.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
        const mood = classifyMood(bs);
        const a = AURAS[mood];
        setAura(a);

        // Overlay aura glow (radial di sekeliling wajah/frame)
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.height * 0.15,
          canvas.width / 2, canvas.height / 2, canvas.height * 0.6
        );
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, a.glow + "AA");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // border glow
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 12;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 30;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setStatus("idle");
    setAura(null);
  };

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Ini fitur hiburan, bukan pemeriksaan psikologi. Warna aura cuma buat seru-seruan
        ngebaca ekspresi wajah kamu real-time.
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/90" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />
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

      {aura && status === "running" && (
        <div className="rounded-2xl p-4 text-center ring-1" style={{ background: aura.glow + "22", borderColor: aura.color }}>
          <p className="text-3xl">{aura.emoji}</p>
          <p className="mt-1 text-lg font-bold" style={{ color: aura.color }}>Aura {aura.label}</p>
          <p className="mt-1 text-sm text-ink/70">{aura.desc}</p>
        </div>
      )}

      {status === "error" && (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {errorMsg}</p>
      )}

      <div className="flex gap-2">
        {status === "idle" || status === "error" ? (
          <button onClick={start} className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            🔮 Mulai Cek Aura
          </button>
        ) : (
          <button onClick={stop} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">
            Stop
          </button>
        )}
        <Link href="/main" className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">
          Kembali
        </Link>
      </div>
    </div>
  );
}
