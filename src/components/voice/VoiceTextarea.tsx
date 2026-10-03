"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  lang?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

export function VoiceTextarea({
  name,
  defaultValue = "",
  required,
  rows = 5,
  placeholder,
  className,
  lang = "id-ID",
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  // Base text = teks yang ada SEBELUM session voice ini dimulai
  const baseTextRef = useRef<string>(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startListening = () => {
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Browser ga support voice. Pakai Chrome/Edge ya.");
      return;
    }

    // Snapshot teks current sebagai base — voice append AFTER this
    baseTextRef.current = value;

    const recognition: SpeechRecognitionInstance = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // PROCESS FULL RESULTS ARRAY — Chrome accumulates results, don't rely on resultIndex.
      // Loop dari 0 sampe akhir, separate final vs interim, REPLACE bukan accumulate.
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Combine base + final + interim. Base bisa kosong atau punya text dari sebelumnya.
      const base = baseTextRef.current;
      const baseTrimmed = base.replace(/\s+$/, "");
      const separator = baseTrimmed ? " " : "";
      const combined = baseTrimmed + separator + finalText + interimText;
      setValue(combined);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const errMsg = event.error === "not-allowed"
        ? "Akses mikrofon ditolak. Allow microphone permission di browser."
        : event.error === "no-speech"
          ? "Ga ada suara terdeteksi. Coba lagi."
          : `Error: ${event.error}`;
      setError(errMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // User edit manual → update base biar voice session next nggak overwrite edit lo
            if (!isListening) {
              baseTextRef.current = e.target.value;
            }
          }}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className={className}
        />
        {isSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all ${
              isListening
                ? "bg-rose-500 text-white shadow-lg animate-pulse"
                : "bg-white text-ink/65 ring-1 ring-ink/15 hover:ring-sky-400 hover:text-sky-600"
            }`}
            aria-label={isListening ? "Stop recording" : "Mulai voice input"}
          >
            <span>{isListening ? "⏹️" : "🎤"}</span>
            <span className="hidden sm:inline">{isListening ? "Stop" : "Voice"}</span>
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-rose-600">⚠️ {error}</p>}
      {isListening && !error && (
        <p className="text-[10px] text-rose-600 animate-pulse">🔴 Lagi denger... ngomong aja, hasil masuk otomatis ke textarea</p>
      )}
      {isSupported && !isListening && !error && (
        <p className="text-[10px] italic text-ink/40">💡 Tap 🎤 buat input pakai suara. Suara diproses browser, cuma teks-nya disimpan ke Soulpace.</p>
      )}
    </div>
  );
}
