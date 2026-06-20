"use client";

import { useEffect, useRef, useState } from "react";

export function TTSButton({
  text,
  lang = "id-ID",
  label = "Dengerin",
  size = "sm",
}: {
  text: string;
  lang?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = () => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!isSupported) return null;

  const sizeClass = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs";

  return (
    <button
      type="button"
      onClick={isPlaying ? stop : speak}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-colors ${sizeClass} ${
        isPlaying
          ? "bg-sky-500 text-white shadow"
          : "bg-white text-sky-600 ring-1 ring-sky-200 hover:bg-sky-50"
      }`}
      aria-label={isPlaying ? "Stop" : label}
    >
      <span>{isPlaying ? "⏸️" : "🔊"}</span>
      <span>{isPlaying ? "Berhenti" : label}</span>
    </button>
  );
}
