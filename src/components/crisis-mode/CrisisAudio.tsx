"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background ambient drone untuk Crisis Mode.
 * Generated via Web Audio API — zero external dependency, full control.
 * 3 oscillator (A2 + E3 + A3) low volume, dengan LFO untuk breathing pulse.
 * Auto-duck via "soulpace:tts" CustomEvent.
 */
export function useCrisisAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  // Target volume (saat ga ke-duck)
  const TARGET_VOLUME = 0.04;
  const DUCKED_VOLUME = 0.005;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    ctxRef.current = ctx;

    // Master gain (volume)
    const master = ctx.createGain();
    master.gain.value = TARGET_VOLUME;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // Lowpass filter buat soften
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.connect(master);

    // 3 oscillator forming a quiet chord (A minor-ish, soothing)
    const freqs = [110, 165, 220]; // A2, E3, A3
    const oscs = freqs.map((f) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      osc.type = "sine";

      // Individual gain per oscillator (different mix)
      const oscGain = ctx.createGain();
      oscGain.gain.value = f === 165 ? 0.4 : 0.5; // mid voice slightly quieter

      osc.connect(oscGain).connect(filter);
      osc.start();
      return osc;
    });
    oscsRef.current = oscs;

    // LFO untuk slow breathing effect on master volume
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // 10 detik cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = TARGET_VOLUME * 0.3; // modulate 30% of base
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    lfoRef.current = lfo;

    // Listen to TTS event untuk ducking
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
        oscs.forEach((osc) => osc.stop());
        lfo.stop();
        ctx.close();
      } catch {
        // ignore — already closed
      }
      ctxRef.current = null;
      masterGainRef.current = null;
      oscsRef.current = [];
      lfoRef.current = null;
    };
  }, [enabled]);
}
