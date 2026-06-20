"use client";

import { useEffect, useRef } from "react";

/**
 * Background ambient untuk Crisis Mode — brown noise calming, BUKAN sine whine.
 * 
 * Sound design:
 * - Brown noise (low-frequency dominant, kayak distant rain/ocean) jadi primary layer
 * - Lowpass filter 400Hz buat cut semua high-freq harshness
 * - Subtle sub-bass sine 55Hz buat body warmth
 * - Slow LFO modulate lowpass cutoff (300-500Hz, 20s cycle) — gentle wave-like sweep
 * - Master volume 0.18 (lebih kedengaran but masih background)
 * - Auto-duck via soulpace:tts → 0.04 saat TTS jalan
 */
export function useCrisisAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const TARGET_VOLUME = 0.18;
  const DUCKED_VOLUME = 0.04;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    ctxRef.current = ctx;

    // === Master gain (volume utama) ===
    const master = ctx.createGain();
    master.gain.value = TARGET_VOLUME;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // === Brown noise generator (primary calming layer) ===
    const bufferSize = ctx.sampleRate * 4; // 4 detik buffer, loops
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // amplify
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // === Lowpass filter — buang high-freq, sisain "rain-like" rumble ===
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 400;
    lowpass.Q.value = 0.7;

    // === LFO modulate lowpass cutoff (gentle wave sweep 300↔500 Hz, 20s cycle) ===
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05; // 20 detik cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100; // sweep ±100 Hz around 400Hz center
    lfo.connect(lfoGain).connect(lowpass.frequency);
    lfo.start();

    // === Sub-bass sine 55Hz buat body warmth (subtle) ===
    const subBass = ctx.createOscillator();
    subBass.type = "sine";
    subBass.frequency.value = 55;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.08; // subtle
    subBass.connect(subGain).connect(master);
    subBass.start();

    // === Chain: noise → lowpass → master ===
    noiseSource.connect(lowpass).connect(master);
    noiseSource.start();

    // === TTS ducking listener ===
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ playing: boolean }>).detail;
      if (!masterGainRef.current || !ctxRef.current) return;
      const targetVol = detail?.playing ? DUCKED_VOLUME : TARGET_VOLUME;
      masterGainRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime);
      masterGainRef.current.gain.linearRampToValueAtTime(targetVol, ctxRef.current.currentTime + 0.3);
    };
    window.addEventListener("soulpace:tts", handler as EventListener);

    return () => {
      window.removeEventListener("soulpace:tts", handler as EventListener);
      try {
        noiseSource.stop();
        subBass.stop();
        lfo.stop();
        ctx.close();
      } catch {
        // ignore — already closed
      }
      ctxRef.current = null;
      masterGainRef.current = null;
    };
  }, [enabled]);
}
