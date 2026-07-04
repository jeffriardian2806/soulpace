"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveAuraSnapshot } from "@/app/main/aura/saveAura";
import { saveScanResult } from "@/app/main/scan/saveScan";

export type AuraMood = {
  mood_key: string; emoji: string; label: string; color: string; glow: string;
  particle: string; desc_short: string; desc_mystic: string;
};
export type ScanContent = {
  mode: string; content_key: string; emoji: string | null; title: string; body: string;
  extra: Record<string, unknown> | null; sort_order: number;
};

type ScanMode = "aura" | "persona" | "bacadiri" | "love" | "umur" | "masadepan" | "batin";
const MODES: { key: ScanMode; icon: string; label: string }[] = [
  { key: "aura", icon: "🔮", label: "Aura" },
  { key: "persona", icon: "🎭", label: "Persona" },
  { key: "bacadiri", icon: "🖐️", label: "Baca Diri" },
  { key: "love", icon: "💘", label: "Love" },
  { key: "umur", icon: "⏳", label: "Umur Emosi" },
  { key: "masadepan", icon: "✨", label: "Masa Depan" },
  { key: "batin", icon: "👁️", label: "Batin" },
];

// ==== Klasifikasi mood — UPGRADE: bobot MATA menang atas mulut ====
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

  // MATA DULU (mata lebih jujur dari mulut):
  if (eyeBlink > 0.45) return "tired";                       // mata lelah menang walau senyum
  if (eyeWide > 0.4 && browUp > 0.35 && smile < 0.15) return "fear";
  if (noseSneer > 0.3 || upperLip > 0.4) return "disgust";
  if (jawOpen > 0.45 && smile > 0.3 && eyeBlink < 0.3) return "joyful";
  if (jawOpen > 0.5 && browUp > 0.4 && smile < 0.2) return "surprised";
  if (browDown > 0.4 && smile < 0.15) return "angry";
  if (smile > 0.35 && eyeSquint < 0.4) return "happy";        // senyum valid cuma kalau mata gak kelelahan
  if (smile > 0.35) return "tired";                            // senyum + mata sipit lelah = tired
  if (frown > 0.2 || (browUp > 0.3 && smile < 0.1)) return "sad";
  if (browDown > 0.2 && eyeSquint > 0.25 && smile < 0.1) return "focused";
  return "neutral";
}

function calcEnergy(bs: Record<string, number>): number {
  const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
  const eyeBlink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
  const eyeWide = ((bs.eyeWideLeft ?? 0) + (bs.eyeWideRight ?? 0)) / 2;
  return Math.max(5, Math.min(100, Math.round(50 + smile * 40 + eyeWide * 20 - eyeBlink * 45)));
}

// seeded pseudo-random (stabil per hari+fitur) biar hasil gak flicker random
function seedPick(seedStr: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number };
type CamMode = "self" | "scan";

export function ScanDiriPlayer({ moods, contents }: { moods: AuraMood[]; contents: ScanContent[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("aura");
  const [camMode, setCamMode] = useState<CamMode>("self");
  const [effect, setEffect] = useState<"mystic" | "particle">("mystic");

  const [aura, setAura] = useState<AuraMood | null>(null);
  const [energy, setEnergy] = useState(0);
  const [bodySignal, setBodySignal] = useState("—");
  const [liveResult, setLiveResult] = useState<{ emoji: string; title: string; body: string; color?: string; score?: number } | null>(null);
  const [locked, setLocked] = useState<null | { mode: ScanMode; camMode: CamMode; emoji: string; title: string; body: string; color?: string; score?: number; energy?: number; bodySignal?: string; auraKey?: string }>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const rafRef = useRef<number | null>(null);
  const faceRef = useRef<unknown>(null);
  const poseRef = useRef<unknown>(null);
  const runningRef = useRef(false);
  const scanModeRef = useRef<ScanMode>(scanMode);
  const effectRef = useRef(effect);
  const auraRef = useRef<AuraMood | null>(null);
  const energyRef = useRef(0);
  const bodyRef = useRef("—");
  const liveRef = useRef<typeof liveResult>(null);
  const particlesRef = useRef<Particle[]>([]);
  const blinkCountRef = useRef(0);
  const blinkStateRef = useRef(false);
  const blinkWindowStart = useRef(0);
  const moodMap = useRef<Record<string, AuraMood>>({});
  const byMode = useRef<Record<string, ScanContent[]>>({});

  useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);
  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => {
    const m: Record<string, AuraMood> = {};
    for (const x of moods) m[x.mood_key] = x;
    moodMap.current = m;
    const g: Record<string, ScanContent[]> = {};
    for (const c of contents) { (g[c.mode] ??= []).push(c); }
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.sort_order - b.sort_order);
    byMode.current = g;
  }, [moods, contents]);

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
      const resolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
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
        video: { facingMode: camMode === "self" ? "user" : "environment", width: 480, height: 640 }, audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (!video.videoWidth) await new Promise<void>((res) => { video.onloadedmetadata = () => res(); });
      blinkCountRef.current = 0; blinkWindowStart.current = performance.now();
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

  const pick = (mode: string, key: string) => byMode.current[mode]?.find((c) => c.content_key === key);
  const listOf = (mode: string, prefix?: string) => (byMode.current[mode] ?? []).filter((c) => !prefix || c.content_key.startsWith(prefix));

  const loop = () => {
    const canvas = canvasRef.current;
    const face = faceRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[]; faceLandmarks?: { x: number; y: number }[][] } } | null;
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
      const m = scanModeRef.current;

      // gambar video mirror; mode masadepan: efek cerah + hangat
      ctx.save(); ctx.scale(-1, 1);
      ctx.filter = m === "masadepan" ? "brightness(1.15) saturate(1.15) contrast(0.97)" : "none";
      ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.restore();

      let fres: { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[]; faceLandmarks?: { x: number; y: number }[][] } | null = null;
      try { fres = face.detectForVideo(v, now); } catch { fres = null; }

      // pose → body signal
      if (pose) {
        try {
          const pres = pose.detectForVideo(v, now);
          if (pres?.landmarks && pres.landmarks.length > 0) {
            const lm = pres.landmarks[0];
            const ls = lm[11], rs = lm[12], nose = lm[0];
            if (ls && rs && nose) {
              const tilt = Math.abs(ls.y - rs.y);
              const midY = (ls.y + rs.y) / 2;
              const neckDrop = midY - nose.y;
              let sig = "confident posture";
              if (tilt > 0.06) sig = "uneven posture";
              else if (neckDrop < 0.18) sig = "low posture confidence";
              else if (midY > 0.75) sig = "slouching / tired posture";
              bodyRef.current = sig; setBodySignal(sig);
            }
          }
        } catch { /* skip */ }
      }

      if (fres?.faceBlendshapes && fres.faceBlendshapes.length > 0) {
        const bs: Record<string, number> = {};
        for (const c of fres.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
        const moodKey = classifyMood(bs);
        const a = moodMap.current[moodKey] ?? moodMap.current["neutral"];
        const e = calcEnergy(bs);
        auraRef.current = a ?? null; energyRef.current = e;
        if (a) { setAura(a); setEnergy(e); }

        // blink counter (love meter)
        const blink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
        if (blink > 0.5 && !blinkStateRef.current) { blinkStateRef.current = true; blinkCountRef.current++; }
        if (blink < 0.3) blinkStateRef.current = false;
        if (now - blinkWindowStart.current > 15000) { blinkCountRef.current = Math.floor(blinkCountRef.current / 2); blinkWindowStart.current = now; }

        const glowColor = a?.glow ?? "#A5C8FF";
        const mainColor = a?.color ?? "#60A5FA";

        // glow dasar (semua mode kecuali masadepan pakai warna aura; masadepan gold)
        const gc = m === "masadepan" ? "#FDE68A" : glowColor;
        const mc = m === "masadepan" ? "#F59E0B" : mainColor;
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.15, canvas.width / 2, canvas.height / 2, canvas.height * 0.6);
        grad.addColorStop(0, "transparent"); grad.addColorStop(1, gc + "88");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = mc; ctx.lineWidth = 10; ctx.shadowColor = mc; ctx.shadowBlur = 24;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10); ctx.shadowBlur = 0;

        // ==== hasil live per mode ====
        const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
        const eyeBlinkAvg = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
        const eyeWide = ((bs.eyeWideLeft ?? 0) + (bs.eyeWideRight ?? 0)) / 2;
        const browDown = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
        const dateSeed = new Date().toISOString().slice(0, 10);

        if (m === "aura" && a) {
          liveRef.current = { emoji: a.emoji, title: `Aura ${a.label}`, body: effectRef.current === "mystic" ? a.desc_mystic : a.desc_short, color: a.color };
        } else if (m === "persona") {
          const list = listOf("persona");
          if (list.length) {
            // derive: dominan ekspresi menentukan indeks + seed harian biar stabil
            const featSig = Math.round(smile * 3) * 7 + Math.round(browDown * 3) * 3 + Math.round(eyeBlinkAvg * 3);
            const c = list[(featSig + seedPick(dateSeed, 6)) % list.length];
            liveRef.current = { emoji: c.emoji ?? "🎭", title: c.title, body: c.body, color: (c.extra?.color as string) ?? mc };
            // topeng overlay: ellipse transparan di area wajah
            const lmk = fres.faceLandmarks?.[0];
            if (lmk && lmk.length > 152) {
              const fx = (1 - lmk[1].x) * canvas.width;   // mirror x
              const fyTop = lmk[10].y * canvas.height;
              const fyBot = lmk[152].y * canvas.height;
              const fh = (fyBot - fyTop) * 1.15;
              ctx.save();
              ctx.globalAlpha = 0.28;
              ctx.fillStyle = (c.extra?.color as string) ?? mc;
              ctx.beginPath();
              ctx.ellipse(fx, (fyTop + fyBot) / 2, fh * 0.42, fh * 0.62, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 0.85;
              ctx.font = `${Math.round(fh * 0.35)}px serif`;
              ctx.textAlign = "center";
              ctx.fillText(c.emoji ?? "🎭", fx, fyTop + fh * 0.2);
              ctx.restore();
            }
          }
        } else if (m === "bacadiri") {
          const list = listOf("karakter");
          if (list.length) {
            const featSig = Math.round(smile * 4) * 5 + Math.round(eyeWide * 4) * 3 + Math.round(browDown * 4);
            const c = list[(featSig + seedPick(dateSeed + "chr", 8)) % list.length];
            liveRef.current = { emoji: c.emoji ?? "📖", title: c.title, body: c.body, color: (c.extra?.color as string) ?? mc };
          }
        } else if (m === "love") {
          // skor: binar mata + senyum kecil + blink rate
          const blinkRate = blinkCountRef.current; // per ~15s window
          let score = Math.round(eyeWide * 55 + smile * 30 + Math.min(blinkRate, 8) * 3);
          score = Math.max(2, Math.min(100, score));
          const tiers = listOf("love");
          const tier = tiers.find((t) => {
            const ex = t.extra as { min?: number; max?: number } | null;
            return ex && score >= (ex.min ?? 0) && score <= (ex.max ?? 100);
          }) ?? tiers[0];
          if (tier) liveRef.current = { emoji: tier.emoji ?? "💘", title: `${tier.title} · ${score}%`, body: tier.body, color: (tier.extra as { color?: string })?.color ?? "#F472B6", score };
        } else if (m === "umur") {
          const tension = browDown; const tiredv = eyeBlinkAvg;
          const beban = Math.round(20 + tension * 28 + tiredv * 24 - smile * 12);
          const umur = Math.max(16, Math.min(70, beban));
          let key = "sepadan";
          if (umur <= 24) key = "muda_ringan"; else if (umur >= 38) key = "lebih_tua";
          const c = pick("umur", key);
          if (c) liveRef.current = { emoji: c.emoji ?? "⏳", title: c.title, body: c.body.replace("{umur}", String(umur)), color: (c.extra?.color as string) ?? mc, score: umur };
        } else if (m === "masadepan") {
          const list = listOf("masadepan");
          if (list.length) {
            const c = list[seedPick(dateSeed + "fut", list.length)];
            liveRef.current = { emoji: c.emoji ?? "✨", title: c.title, body: c.body, color: "#F59E0B" };
          }
        } else if (m === "batin") {
          const mata = eyeBlinkAvg > 0.35 ? "mata_lelah" : eyeWide > 0.3 ? "mata_waspada" : "mata_segar";
          const senyum = smile > 0.3 ? (eyeBlinkAvg > 0.3 ? "senyum_bertahan" : "senyum_tulus") : "senyum_hilang";
          const bahu = bodyRef.current.includes("confident") || bodyRef.current.includes("good") ? "bahu_tegak" : "bahu_menahan";
          let penutup = "penutup_campur";
          if (mata === "mata_segar" && senyum === "senyum_tulus" && bahu === "bahu_tegak") penutup = "penutup_baik";
          else if (senyum === "senyum_bertahan" || (mata === "mata_lelah" && bahu === "bahu_menahan")) penutup = "penutup_kuat";
          else if (mata === "mata_lelah") penutup = "penutup_lelah";
          const parts = [pick("batin", mata)?.body, pick("batin", senyum)?.body, pick("batin", bahu)?.body].filter(Boolean).join(", ");
          const close = pick("batin", penutup)?.body ?? "";
          liveRef.current = { emoji: "👁️", title: "Pembacaan Batin", body: `${parts} ${close}`, color: mc };
        }
        setLiveResult(liveRef.current);

        // partikel (efek ✨) — jalan di mode aura aja biar mode lain bersih
        if (m === "aura" && effectRef.current === "particle" && a) {
          spawn(canvas.width, canvas.height, a.particle);
          const arr = particlesRef.current;
          for (let i = arr.length - 1; i >= 0; i--) {
            const p = arr[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
            if (p.life <= 0) { arr.splice(i, 1); continue; }
            ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = a.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (m !== "aura") particlesRef.current = [];
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const lockResult = () => {
    const lr = liveRef.current;
    if (!lr) return;
    setLocked({
      mode: scanModeRef.current, camMode, emoji: lr.emoji, title: lr.title, body: lr.body,
      color: lr.color, score: lr.score, energy: energyRef.current, bodySignal: bodyRef.current,
      auraKey: auraRef.current?.mood_key,
    });
    setSaveState("idle");
  };

  const save = async () => {
    if (!locked || locked.camMode !== "self") return;
    setSaveState("saving");
    let err: string | null = null;
    if (locked.mode === "aura" && auraRef.current) {
      const r = await saveAuraSnapshot({
        mood_key: auraRef.current.mood_key, aura_label: auraRef.current.label,
        mood_text: auraRef.current.desc_short, energy: locked.energy ?? 0, body_signal: locked.bodySignal ?? "",
      });
      err = r.error;
    } else {
      const r = await saveScanResult({
        mode: locked.mode,
        result: { emoji: locked.emoji, title: locked.title, body: locked.body, score: locked.score ?? null, energy: locked.energy ?? null, body_signal: locked.bodySignal ?? null },
      });
      err = r.error;
    }
    setSaveState(err ? "error" : "saved");
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video?.srcObject) { (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); video.srcObject = null; }
    particlesRef.current = [];
    setStatus("idle"); setAura(null); setLiveResult(null);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ✨ Semua mode di sini hiburan, bukan pemeriksaan psikologi. {camMode === "scan" && "Mode Scan Orang: hasil nggak disimpan."}
      </div>

      {status === "idle" && (
        <div className="flex gap-2">
          <button onClick={() => { setCamMode("self"); setLocked(null); setSaveState("idle"); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${camMode === "self" ? "bg-sky-500 text-white ring-sky-500" : "bg-white text-ink/60 ring-ink/15"}`}>🙂 Cek Diri</button>
          <button onClick={() => { setCamMode("scan"); setLocked(null); setSaveState("idle"); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${camMode === "scan" ? "bg-purple-500 text-white ring-purple-500" : "bg-white text-ink/60 ring-ink/15"}`}>👁️ Scan Orang</button>
        </div>
      )}

      {/* Icon switcher mode (kayak filter IG) */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {MODES.map((mo) => (
          <button
            key={mo.key}
            onClick={() => { setScanMode(mo.key); setLocked(null); setSaveState("idle"); }}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition ${scanMode === mo.key ? "scale-105 bg-white shadow-md ring-2 ring-sky-400" : "bg-white/60 ring-1 ring-ink/10"}`}
          >
            <span className="text-xl">{mo.icon}</span>
            <span className="text-[10px] font-medium text-ink/70">{mo.label}</span>
          </button>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-ink/90" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full object-cover" />

        {/* toggle efek — cuma relevan di mode aura */}
        {status === "running" && scanMode === "aura" && (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button onClick={() => setEffect("mystic")} className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${effect === "mystic" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-purple-400" : "bg-black/30 text-white/70"}`}>🔮</button>
            <button onClick={() => setEffect("particle")} className={`flex h-11 w-11 items-center justify-center rounded-full text-xl backdrop-blur transition ${effect === "particle" ? "scale-110 bg-white/90 shadow-lg ring-2 ring-sky-400" : "bg-black/30 text-white/70"}`}>✨</button>
          </div>
        )}

        {/* scouter mini (aura & batin) */}
        {status === "running" && aura && (scanMode === "aura" || scanMode === "batin") && (
          <div className="absolute left-3 top-3 rounded-xl bg-black/55 p-2.5 text-left backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/50">Today&apos;s Aura</p>
            <p className="text-sm font-bold" style={{ color: aura.glow }}>{aura.label}</p>
            <p className="mt-1 text-[10px] text-white/70">Energy: {energy}%</p>
            <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full" style={{ width: `${energy}%`, background: aura.color }} />
            </div>
            <p className="mt-1 text-[10px] text-white/70">Body: {bodySignal}</p>
          </div>
        )}

        {/* hasil live bawah */}
        {status === "running" && liveResult && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 text-center">
            <span className="text-lg">{liveResult.emoji}</span>
            <span className="ml-2 font-bold" style={{ color: liveResult.color ?? "#fff" }}>{liveResult.title}</span>
            <p className="mt-1.5 text-xs italic leading-relaxed text-white/90">{liveResult.body}</p>
          </div>
        )}

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <span className="text-5xl">{MODES.find((x) => x.key === scanMode)?.icon}</span>
            <p className="text-sm">{camMode === "self" ? "Tap mulai buat scan diri kamu" : "Arahin ke orang lain, tap mulai"}</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <span className="animate-pulse text-4xl">✨</span>
            <p className="text-sm">Menyiapkan AR...</p>
          </div>
        )}
      </div>

      {/* kartu hasil terkunci */}
      {locked && (
        <div className="rounded-2xl p-5 text-center ring-2" style={{ background: `linear-gradient(160deg, ${(locked.color ?? "#A5C8FF")}33, ${(locked.color ?? "#A5C8FF")}11)`, borderColor: locked.color ?? "#60A5FA" }}>
          <p className="text-4xl">{locked.emoji}</p>
          <p className="mt-1 text-xl font-bold" style={{ color: locked.color ?? "#0369A1" }}>{locked.title}</p>
          <p className="mt-2 text-sm italic leading-relaxed text-ink/75">{locked.body}</p>
          {(locked.mode === "aura" || locked.mode === "batin") && (
            <div className="mt-2 space-y-0.5 text-xs text-ink/60">
              {locked.energy != null && <p>Energy: <b>{locked.energy}%</b></p>}
              {locked.bodySignal && <p>Body Signal: <b>{locked.bodySignal}</b></p>}
            </div>
          )}
          <p className="mt-3 text-[11px] text-ink/45">Flouwell · Scan Diri AR · {today}</p>

          {locked.camMode === "self" ? (
            <div className="mt-3">
              {saveState === "saved" ? (
                <p className="text-xs font-semibold text-emerald-600">✓ Tersimpan ke riwayat kamu</p>
              ) : (
                <button onClick={save} disabled={saveState === "saving"} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  {saveState === "saving" ? "Menyimpan..." : "💾 Simpan ke Riwayat"}
                </button>
              )}
              {saveState === "error" && <p className="mt-1 text-xs text-rose-600">Gagal simpan. Coba lagi (harus login).</p>}
            </div>
          ) : (
            <p className="mt-3 text-[11px] italic text-ink/45">Mode scan orang — hasil nggak disimpan.</p>
          )}
        </div>
      )}

      {status === "error" && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {errorMsg}</p>}

      <div className="flex flex-wrap gap-2">
        {status === "idle" || status === "error" ? (
          <button onClick={start} className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white">🔮 Mulai {camMode === "self" ? "Cek Diri" : "Scan Orang"}</button>
        ) : (
          <>
            <button onClick={lockResult} className="flex-1 rounded-full bg-purple-500 px-4 py-3 text-sm font-semibold text-white">🔒 Kunci Hasil</button>
            <button onClick={stop} className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Stop</button>
          </>
        )}
        <Link href="/main" className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Kembali</Link>
      </div>
    </div>
  );
}
