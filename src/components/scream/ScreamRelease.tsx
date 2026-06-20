"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Mode = "intro" | "listening" | "active" | "cooldown" | "done";

const VOLUME_THRESHOLD = 70; // 0-255 — di atas ini count sebagai "release"
const MIN_RELEASE_DURATION_MS = 400; // minimal 0.4 detik di atas threshold buat counted as session
const SILENCE_TIMEOUT_MS = 2000; // 2 detik silence → trigger cooldown

const ENCOURAGEMENT_MESSAGES = [
  "Udah keluarin. Itu valid.",
  "Beban yang lo bawa berat. Lo butuh keluarin.",
  "Lo dengar diri sendiri. Itu udah cukup hari ini.",
  "Nafas. Gw nemenin.",
  "Apa yang lo rasain sekarang nyata. Lo ga sendirian.",
];

export function ScreamRelease() {
  const [mode, setMode] = useState<Mode>("intro");
  const [error, setError] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [encouragement, setEncouragement] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const aboveThresholdStartRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const lastActiveTimeRef = useRef<number>(0);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListening = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startListening = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
      });
      streamRef.current = stream;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // RMS volume calculation
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = Math.min(255, rms);
        setCurrentVolume(volume);

        const now = performance.now();

        if (volume > VOLUME_THRESHOLD) {
          if (aboveThresholdStartRef.current === null) {
            aboveThresholdStartRef.current = now;
          }
          silenceStartRef.current = null;
          lastActiveTimeRef.current = now;

          // Transition to active if sustained
          if (
            now - (aboveThresholdStartRef.current ?? now) >= MIN_RELEASE_DURATION_MS &&
            mode !== "active" &&
            mode !== "cooldown"
          ) {
            setMode("active");
          }
        } else {
          aboveThresholdStartRef.current = null;
          if (silenceStartRef.current === null && lastActiveTimeRef.current > 0) {
            silenceStartRef.current = now;
          }

          // Trigger cooldown after silence
          if (
            silenceStartRef.current !== null &&
            now - silenceStartRef.current >= SILENCE_TIMEOUT_MS &&
            mode === "active"
          ) {
            triggerCooldown();
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setMode("listening");
    } catch (e) {
      const err = e as Error;
      if (err.name === "NotAllowedError") {
        setError("Mikrofon ditolak. Allow permission di browser settings buat fitur ini.");
      } else {
        setError(`Error: ${err.message}`);
      }
      setMode("intro");
    }
  };

  const triggerCooldown = () => {
    setSessionCount((c) => c + 1);
    const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
    setEncouragement(msg);
    setMode("cooldown");
    silenceStartRef.current = null;
    lastActiveTimeRef.current = 0;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(50);
    }
  };

  const endSession = () => {
    stopListening();
    setMode("done");
  };

  const restart = () => {
    stopListening();
    setMode("intro");
    setSessionCount(0);
    setCurrentVolume(0);
    setEncouragement("");
    setError(null);
    aboveThresholdStartRef.current = null;
    silenceStartRef.current = null;
    lastActiveTimeRef.current = 0;
  };

  // === RENDER PER MODE ===

  if (mode === "intro") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 p-6 text-white shadow-xl">
          <p className="text-5xl">📢</p>
          <p className="mt-2 text-lg font-bold">Lampias Suara</p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            Kadang otak penuh, pikiran muter, dada sesak — kata-kata ga cukup. Lampiasin pakai suara. Teriak, hum, helaan napas keras — apapun yang lo butuh keluarin.
          </p>
        </div>

        <section className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-ink/55">💡 Cara kerjanya</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/75">
            <li>• Tap tombol mulai → mikrofon aktif (allow permission)</li>
            <li>• Teriak, hum, atau helaan napas keras — apapun mode lo</li>
            <li>• Layar respon real-time ke suara lo</li>
            <li>• Setelah lo selesai (2 detik diam), muncul pesan tenang</li>
            <li>• Mau ulang? Tinggal mulai lagi.</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <p className="text-xs leading-relaxed text-ink/70">
            <strong>⚠️ Privacy:</strong> Suara lo <strong>tidak direkam</strong>, <strong>tidak disimpan</strong>, <strong>tidak dikirim kemana-mana</strong>. Diproses real-time di browser. Begitu lo tutup halaman ini, semua audio data hilang.
          </p>
        </section>

        <section className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-200">
          <p className="text-[11px] leading-relaxed text-ink/70">
            <strong>Konteks ga bisa teriak?</strong> Apartment, ruang kerja, dorm — silent mode tetep work. Hum keras (mmmmm), helaan napas keras (hhhhhh), atau bisikan kuat. Sistem detect intensitas, bukan volume mentah.
          </p>
        </section>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {error}</div>
        )}

        <button
          onClick={startListening}
          className="rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          🎤 Mulai (allow mikrofon dulu)
        </button>
      </div>
    );
  }

  // listening or active mode — share canvas
  if (mode === "listening" || mode === "active") {
    const intensity = Math.min(1, currentVolume / 150);
    const isActive = mode === "active";

    return (
      <div className="flex flex-col gap-4">
        {/* Main visualizer */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-3xl transition-colors duration-300"
          style={{
            background: `radial-gradient(circle at center,
              hsl(${30 + intensity * 280}, 80%, ${50 + intensity * 20}%) 0%,
              hsl(${260 + intensity * 60}, 60%, ${20 + intensity * 30}%) 70%)`,
          }}
        >
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full border-4 border-white/30 transition-all duration-100"
              style={{
                width: `${30 + intensity * 70}%`,
                height: `${30 + intensity * 70}%`,
                opacity: 0.4 + intensity * 0.6,
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full bg-white/30 transition-all duration-100"
              style={{
                width: `${10 + intensity * 30}%`,
                height: `${10 + intensity * 30}%`,
                opacity: 0.5 + intensity * 0.5,
                filter: `blur(${intensity * 8}px)`,
              }}
            />
          </div>

          {/* Status text overlay */}
          <div className="absolute inset-x-0 bottom-6 text-center">
            {isActive ? (
              <p className="text-white text-lg font-bold drop-shadow">Lo lagi dengar diri sendiri.</p>
            ) : (
              <p className="text-white/85 text-sm font-medium drop-shadow">
                {currentVolume < 10 ? "Mendengarkan..." : "Iya, gw denger."}
              </p>
            )}
          </div>
        </div>

        {/* Volume bar */}
        <div className="rounded-full bg-ink/5 overflow-hidden h-2">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 transition-all duration-100"
            style={{ width: `${Math.min(100, (currentVolume / 200) * 100)}%` }}
          />
        </div>

        <button
          onClick={endSession}
          className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15"
        >
          Cukup, selesai
        </button>
      </div>
    );
  }

  if (mode === "cooldown") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 via-purple-400 to-emerald-400 p-8 text-white shadow-xl text-center">
          <p className="text-6xl">💙</p>
          <p className="mt-4 text-xl font-bold leading-snug">{encouragement}</p>
          <p className="mt-4 text-xs text-white/80">Session #{sessionCount}</p>
        </div>

        <p className="text-center text-sm leading-relaxed text-ink/65">
          Lo udah keluarin. Tarik napas pelan.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMode("listening")}
            className="rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-6 py-3 text-sm font-bold text-white"
          >
            🎤 Mau lampias lagi
          </button>
          <button
            onClick={endSession}
            className="rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-ink/15"
          >
            Cukup, selesai
          </button>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-sky-400 to-purple-400 p-6 text-white shadow-lg">
        <p className="text-4xl">✨</p>
        <p className="mt-2 text-lg font-bold">Lo udah selesai.</p>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          {sessionCount > 0
            ? `${sessionCount} kali lampias. Lo udah dengar diri sendiri. Itu pekerjaan yang valid.`
            : "Lo udah ada di sini. Itu udah cukup hari ini."}
        </p>
      </div>

      <section className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-ink/55">💡 Selanjutnya</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          Lampias suara ngerelease tension. Kalau mau lanjut grounding, coba:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/main/grounding" className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
            🧭 Grounding 5-4-3-2-1
          </Link>
          <Link href="/main/napas" className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            🌬️ Latihan Napas
          </Link>
          <Link href="/ambient" className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
            🎵 Suara Tenang
          </Link>
          <Link href="/safety-plan/crisis" className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
            🛟 Daftar Aman
          </Link>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          onClick={restart}
          className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
        >
          🔄 Lampias lagi
        </button>
        <Link href="/main" className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200">
          ← Main
        </Link>
      </div>
    </div>
  );
}
