"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useCrisisAudio } from "./CrisisAudio";
import { spellPhoneForTTS, humanizeForTTS } from "@/lib/voiceUtils";

type Contact = { name: string; phone: string; note?: string };
type ProfessionalContact = { name: string; phone: string; type: string };

type Props = {
  safetyPlan: {
    help_contacts: Contact[];
    professional_contacts: ProfessionalContact[];
    means_restriction: string[];
    internal_strategies: string[];
    is_complete: boolean;
  } | null;
  anchorPhotos: { signed_url: string | null; caption: string | null }[];
  messages: {
    phase_opening: string;
    phase_means_check: string;
    phase_means_restrict: string;
    phase_connection_intro: string;
    phase_done_encouragement: string;
    companion_gentle: string[];
  };
};

type Phase = "opening" | "means_check" | "means_restrict" | "connection" | "companion" | "done";

const PHASE_1_DURATION = 30; // detik
const PHASE_4_DURATION = 600; // 10 menit
const PHOTO_ROTATE_INTERVAL = 60; // detik
const MESSAGE_ROTATE_INTERVAL = 40; // detik

const telHref = (phone: string) => `tel:${phone.replace(/\s|-|ext\.?/gi, "")}`;

/**
 * Speak text via SpeechSynthesis with ducking event dispatched.
 * Returns cancel function.
 */
function speakAuto(text: string): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(humanizeForTTS(text));
  utter.lang = "id-ID";
  utter.rate = 0.9;
  utter.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find((v) => v.lang.startsWith("id"));
  if (idVoice) utter.voice = idVoice;

  const dispatchTTS = (playing: boolean) => {
    window.dispatchEvent(new CustomEvent("soulpace:tts", { detail: { playing } }));
  };

  utter.onend = () => dispatchTTS(false);
  utter.onerror = () => dispatchTTS(false);

  dispatchTTS(true);
  window.speechSynthesis.speak(utter);

  return () => {
    window.speechSynthesis.cancel();
    dispatchTTS(false);
  };
}

export function CrisisCompanion({ safetyPlan, anchorPhotos, messages }: Props) {
  const [phase, setPhase] = useState<Phase>("opening");
  const [phase1Remaining, setPhase1Remaining] = useState(PHASE_1_DURATION);
  const [phase4Remaining, setPhase4Remaining] = useState(PHASE_4_DURATION);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  // Audio state: TTS auto-speak + background drone. Default ON.
  const [audioEnabled, setAudioEnabled] = useState(true);
  const haptRef = useRef<number | null>(null);

  // Background ambient drone — hook handles lifecycle
  useCrisisAudio(audioEnabled);

  // === AUTO-TTS speak helper, respects audioEnabled ===
  const autoSpeak = useCallback((text: string) => {
    if (!audioEnabled) return () => {};
    return speakAuto(text);
  }, [audioEnabled]);

  // === Phase 1: 30-sec somatic anchor with haptic ===
  useEffect(() => {
    if (phase !== "opening") return;

    // Heartbeat haptic every 1 second (60bpm)
    const hapticInterval = setInterval(() => {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([60, 100, 40]);
      }
    }, 1000);
    haptRef.current = hapticInterval as unknown as number;

    // Countdown
    const tickInterval = setInterval(() => {
      setPhase1Remaining((r) => {
        if (r <= 1) {
          clearInterval(tickInterval);
          clearInterval(hapticInterval);
          setPhase("means_check");
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(hapticInterval);
    };
  }, [phase]);
  // === AUTO-TTS per phase change ===
  useEffect(() => {
    let cancelFn: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Small delay biar visual + TTS sync
    timeoutId = setTimeout(() => {
      let text = "";

      switch (phase) {
        case "opening":
          text = messages.phase_opening;
          break;
        case "means_check":
          text = messages.phase_means_check;
          break;
        case "means_restrict":
          text = messages.phase_means_restrict;
          break;
        case "connection": {
          const profContacts = safetyPlan?.professional_contacts ?? [];
          const profDefault: ProfessionalContact[] = profContacts.length === 0 ? [
            { name: "SEJIWA", phone: "119 ext 8", type: "crisis_line" },
            { name: "Halo Kemenkes", phone: "1500-567", type: "crisis_line" },
          ] : [];
          const allProf = [...profContacts, ...profDefault];
          const helpContacts = safetyPlan?.help_contacts ?? [];

          const profList = allProf.map(c => `${c.name}, nomor ${spellPhoneForTTS(c.phone)}`).join(". ");
          const helpList = helpContacts.map(c => `${c.name}, nomor ${spellPhoneForTTS(c.phone)}`).join(". ");

          text = messages.phase_connection_intro;
          if (profList) text += ` Telepon profesional atau crisis line. ${profList}.`;
          if (helpList) text += ` Atau orang yang bisa lo minta tolong. ${helpList}.`;
          break;
        }
        case "done":
          text = messages.phase_done_encouragement;
          break;
        case "companion":
        default:
          text = ""; // Companion mode pakai rotation effect (separate useEffect)
      }

      if (text) cancelFn = autoSpeak(text);
    }, 400);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cancelFn) cancelFn();
    };
  }, [phase, autoSpeak, safetyPlan, messages]);

  // === AUTO-TTS for companion message rotation ===
  useEffect(() => {
    if (phase !== "companion") return;
    const text = messages.companion_gentle[messageIdx];
    const cancel = autoSpeak(text);
    return () => cancel();
  }, [phase, messageIdx, autoSpeak]);


  // === Phase 4: 10-min companion timer + photo/message rotation ===
  useEffect(() => {
    if (phase !== "companion") return;

    setPhase4Remaining(PHASE_4_DURATION);

    const tickInterval = setInterval(() => {
      setPhase4Remaining((r) => {
        if (r <= 1) {
          clearInterval(tickInterval);
          setPhase("done");
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    // Rotate gentle messages
    const msgInterval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % messages.companion_gentle.length);
    }, MESSAGE_ROTATE_INTERVAL * 1000);

    // Rotate photos
    let photoInterval: ReturnType<typeof setInterval> | null = null;
    if (anchorPhotos.length > 1) {
      photoInterval = setInterval(() => {
        setPhotoIdx((i) => (i + 1) % anchorPhotos.length);
      }, PHOTO_ROTATE_INTERVAL * 1000);
    }

    // Gentle haptic every 30 sec biar feel "ada"
    const gentleHapticInterval = setInterval(() => {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(30);
      }
    }, 30000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(msgInterval);
      if (photoInterval) clearInterval(photoInterval);
      clearInterval(gentleHapticInterval);
    };
  }, [phase, anchorPhotos.length]);

  // === RENDER PER PHASE ===

  if (phase === "opening") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 px-6 py-8 overflow-hidden">
        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
          aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
        </button>

        {/* Pulsing background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-rose-200/40 via-amber-200/40 to-purple-200/40"
          style={{ animation: "breathe 10s ease-in-out infinite" }}
        />

        {/* Center pulsing orb */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div
            className="rounded-full bg-gradient-to-br from-rose-400 via-amber-400 to-purple-400 shadow-2xl"
            style={{
              width: 200,
              height: 200,
              animation: "breathe 10s ease-in-out infinite",
            }}
          />

          <div className="text-center">
            <p className="text-2xl font-bold text-ink">Gw di sini sama lo.</p>
            <p className="mt-3 text-xs text-ink/50">{phase1Remaining}s</p>
          </div>

          <button
            onClick={() => setPhase("means_check")}
            className="rounded-full bg-white/80 backdrop-blur px-4 py-2 text-xs font-medium text-ink/65 ring-1 ring-ink/15"
          >
            Lanjut sekarang →
          </button>
        </div>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(0.95); opacity: 0.85; }
            50% { transform: scale(1.05); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (phase === "means_check") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 px-6">
        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
          aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
        </button>

        <div className="max-w-md w-full flex flex-col gap-6 text-center">
          <p className="text-3xl">🌿</p>
          <p className="text-lg font-bold text-ink">Sebelum lanjut.</p>
          <p className="text-sm leading-relaxed text-ink/75">
            Ada benda yang bisa nyakitin lo deket sekarang?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPhase("connection")}
              className="rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white"
            >
              Udah aman
            </button>
            <button
              onClick={() => setPhase("means_restrict")}
              className="rounded-full bg-white px-6 py-3 text-base font-medium text-ink/75 ring-1 ring-rose-200"
            >
              Belum aman
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "means_restrict") {
    const userMeans = safetyPlan?.means_restriction ?? [];
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 px-6 overflow-y-auto py-8">
        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
          aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
        </button>

        <div className="max-w-md w-full flex flex-col gap-5">
          <p className="text-center text-3xl">🔒</p>
          <p className="text-center text-lg font-bold text-ink">Coba pindahin dulu.</p>
          <p className="text-center text-sm leading-relaxed text-ink/75">
            Pindahin ke ruangan lain, atau kasih ke orang. Gw nunggu.
          </p>

          {userMeans.length > 0 && (
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-amber-200">
              <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Daftar Aman kamu</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/80">
                {userMeans.map((m, i) => (
                  <li key={i}>☐ {m}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setPhase("connection")}
            className="rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white"
          >
            ✓ Udah pindahin
          </button>
        </div>
      </div>
    );
  }

  if (phase === "connection") {
    const helpContacts = safetyPlan?.help_contacts ?? [];
    const profContacts = safetyPlan?.professional_contacts ?? [];
    // Always show default crisis lines kalau user belum isi
    const defaultCrisis: ProfessionalContact[] = profContacts.length === 0 ? [
      { name: "SEJIWA", phone: "119 ext 8", type: "crisis_line" },
      { name: "Halo Kemenkes", phone: "1500-567", type: "crisis_line" },
    ] : [];
    const allProfContacts = [...profContacts, ...defaultCrisis];

    return (
      <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 px-6 py-6 overflow-y-auto">
        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
          aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
        </button>

        <div className="max-w-md w-full mx-auto flex flex-col gap-4">
          <div className="text-center">
            <p className="text-3xl">📞</p>
            <p className="mt-2 text-lg font-bold text-ink">Konek ke manusia dulu.</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/65">
              Suara orang &gt; teks. Voice ngebawa breathing pattern + tone yang somatic.
            </p>
          </div>

          {/* Professional / Crisis lines */}
          {allProfContacts.length > 0 && (
            <section>
              <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold mb-2">🏥 Profesional & Crisis Line</p>
              <div className="flex flex-col gap-2">
                {allProfContacts.map((c, i) => (
                  <a key={i} href={telHref(c.phone)} className="flex items-center justify-between rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 active:bg-rose-100">
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-ink/55">{c.type === "crisis_line" ? "Crisis Line 24 jam" : c.type}</p>
                    </div>
                    <span className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">📞 {c.phone}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Help contacts dari Safety Plan */}
          {helpContacts.length > 0 && (
            <section>
              <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">🤝 Orang yang lo bisa minta tolong</p>
              <div className="flex flex-col gap-2">
                {helpContacts.map((c, i) => (
                  <a key={i} href={telHref(c.phone)} className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200 active:bg-emerald-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                      {c.note && <p className="text-xs text-ink/55 truncate">{c.note}</p>}
                    </div>
                    <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shrink-0">📞</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {!safetyPlan?.is_complete && (
            <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
              <p className="text-xs leading-relaxed text-ink/70">
                💡 <Link href="/safety-plan" className="text-sky-600 font-medium underline">Isi Daftar Aman</Link> di moment tenang biar nomor-nomor lo siap di-tap pas crisis.
              </p>
            </div>
          )}

          <button
            onClick={() => setPhase("companion")}
            className="mt-4 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 px-6 py-3 text-base font-semibold text-white"
          >
            Temenin gw lewat layar →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "companion") {
    const min = Math.floor(phase4Remaining / 60);
    const sec = phase4Remaining % 60;
    const photo = anchorPhotos[photoIdx];

    return (
      <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 px-6 py-6 overflow-hidden">
        <button
          onClick={() => setAudioEnabled(prev => !prev)}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
          aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
        </button>

        {/* Pulsing background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-amber-100/40 via-rose-100/50 to-purple-100/40"
          style={{ animation: "breathe 10s ease-in-out infinite" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-3 max-w-md w-full mx-auto">
          {/* Anchor photo (if any) — adapts to image native aspect ratio, max-h capped */}
          {photo?.signed_url ? (
            <div className="relative flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.signed_url}
                alt=""
                className="block rounded-3xl shadow-2xl ring-4 ring-white/80 max-w-[100vw] max-h-[78vh] w-auto h-auto"
              />
              {photo.caption && (
                <p className="mt-3 rounded-full bg-white/95 px-4 py-1.5 text-sm font-medium text-ink/80 shadow-lg max-w-[80vw] truncate">
                  {photo.caption}
                </p>
              )}
            </div>
          ) : (
            // Fallback orb kalau ga ada foto
            <div
              className="rounded-full bg-gradient-to-br from-rose-300 via-amber-300 to-purple-300 shadow-2xl"
              style={{ width: 160, height: 160, animation: "breathe 10s ease-in-out infinite" }}
            />
          )}

          {/* Gentle message */}
          <p className="text-center text-lg font-medium text-ink/85 px-4 leading-relaxed">
            {messages.companion_gentle[messageIdx]}
          </p>

          {/* Timer */}
          <p className="text-xs text-ink/50 tabular-nums">
            {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
          </p>
        </div>

        {/* End button */}
        <button
          onClick={() => setPhase("done")}
          className="relative z-10 mx-auto rounded-full bg-white/80 backdrop-blur px-5 py-2.5 text-xs font-medium text-ink/65 ring-1 ring-ink/15"
        >
          Cukup, gw udah lewat
        </button>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // done
  const internalStrategies = safetyPlan?.internal_strategies ?? [];
  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-8">
      <button
        onClick={() => setAudioEnabled(prev => !prev)}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15 shadow"
        aria-label={audioEnabled ? "Matikan suara" : "Nyalakan suara"}
      >
        {audioEnabled ? "🔊 Suara ON" : "🔇 Suara OFF"}
      </button>
      <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-sky-400 to-purple-400 p-6 text-white shadow-lg">
        <p className="text-5xl">🌅</p>
        <p className="mt-3 text-xl font-bold">Lo udah lewatin moment ini.</p>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          Yang berat tadi udah lewat. Lo masih ada. Itu pekerjaan paling penting hari ini.
        </p>
      </div>

      {internalStrategies.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-ink/55">🛡️ Dari Daftar Aman kamu</p>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink/75">
            {internalStrategies.slice(0, 3).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide text-ink/55">Selanjutnya, kalau mau:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/main/napas" className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">🌬️ Latihan Napas</Link>
          <Link href="/main/grounding" className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">🧭 Grounding 5-4-3-2-1</Link>
          <Link href="/scream" className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">📢 Lampias Suara</Link>
          <Link href="/ambient" className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">🎵 Suara Tenang</Link>
          <Link href="/edukasi" className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">📚 Tips Edukasi</Link>
          <Link href="/resource" className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-800 ring-1 ring-rose-300">🌐 Pusat Bantuan</Link>
        </div>
      </section>

      <Link href="/main" className="rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200">
        ← Kembali ke Main
      </Link>

      <p className="pb-4 text-center text-[11px] italic text-ink/40">
        Kalau berat masih dirasakan dalam jam-jam berikutnya, hubungi profesional. Crisis Mode tool, bukan terapi.
      </p>
    </main>
  );
}
