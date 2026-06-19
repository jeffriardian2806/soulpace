"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveGameResultAction } from "@/app/main/saveResult";

type Option = { label: string; emoji: string; interpretation: string };
type Item = {
  slug: string;
  prompt: string;
  image_url: string;
  options: Option[];
};

type Pick = { itemSlug: string; option: Option };

export function VisualFirstSightPlayer({ items }: { items: Item[] }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (idx >= items.length && !savedRef.current) {
      savedRef.current = true;
      saveGameResultAction("mata-pertama", {
        title: "Mata Pertama",
        headline: `${picks.length} refleksi dipilih`,
        value: `${picks.map((p) => p.option.emoji).join(" ")}`,
        emoji: "👁️",
      }, { picks });
    }
  }, [idx, items.length, picks]);

  // Intro
  if (idx === -1) {
    return null;
  }

  // Result reveal
  if (idx >= items.length) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-purple-400 p-6 text-white shadow-xl">
          <p className="text-4xl">✨</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-white/80">Refleksi kamu</p>
          <p className="mt-1 text-xl font-bold">Apa yang kamu lihat mencerminkan vibe kamu hari ini</p>
        </div>

        <section className="flex flex-col gap-3">
          {picks.map((p, i) => (
            <div key={p.itemSlug} className="glass rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{p.option.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink/55">Gambar {i + 1} — Lo lihat: {p.option.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">{p.option.interpretation}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="rounded-2xl bg-sky-50/50 p-4 ring-1 ring-sky-100">
          <p className="text-[10px] uppercase tracking-wide text-sky-700">💡 Catatan</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/65">
            Ini refleksi playful — apa yang lo lihat pertama bisa kasih hint mood/vibe lo, tapi <strong>bukan diagnosis psikologi</strong>. Bisa beda kalau dilakuin di waktu lain.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setIdx(0); setPicks([]); setRevealedIdx(null); savedRef.current = false; }}
            className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
          >
            🔄 Coba lagi
          </button>
          <Link href="/main" className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-200">
            ← Kembali ke Main
          </Link>
        </div>
      </div>
    );
  }

  // Playing — show current item
  const item = items[idx];
  const isRevealed = revealedIdx === idx;
  const selectedOption = isRevealed ? picks[idx]?.option : null;

  const handlePick = (opt: Option) => {
    if (isRevealed) return;
    setPicks([...picks, { itemSlug: item.slug, option: opt }]);
    setRevealedIdx(idx);
  };

  const handleNext = () => {
    setIdx(idx + 1);
    setRevealedIdx(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink/55">Gambar {idx + 1} dari {items.length}</p>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-sky-500" : "bg-ink/10"}`} />
          ))}
        </div>
      </div>

      {/* Prompt */}
      <p className="text-sm font-semibold text-ink">{item.prompt}</p>

      {/* Image */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-ink/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={`Gambar refleksi ${idx + 1}`} className="w-full h-auto" />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {item.options.map((opt, i) => {
          const isPicked = selectedOption?.label === opt.label;
          return (
            <button
              key={i}
              onClick={() => handlePick(opt)}
              disabled={isRevealed && !isPicked}
              className={`group rounded-2xl p-3 text-left transition-all ${
                isPicked
                  ? "bg-gradient-to-br from-sky-500 to-purple-600 text-white shadow-lg scale-[1.02]"
                  : isRevealed
                  ? "bg-ink/5 text-ink/40 cursor-not-allowed"
                  : "bg-white ring-1 ring-sky-200 hover:ring-sky-400 hover:scale-[1.02]"
              }`}
            >
              <p className="text-2xl">{opt.emoji}</p>
              <p className={`mt-1 text-sm font-semibold ${isPicked ? "text-white" : "text-ink"}`}>{opt.label}</p>
            </button>
          );
        })}
      </div>

      {/* Reveal interpretation */}
      {isRevealed && selectedOption && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-4 ring-1 ring-amber-200">
          <p className="text-xs uppercase tracking-wide text-amber-700">💡 Refleksi</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{selectedOption.interpretation}</p>
          <button
            onClick={handleNext}
            className="mt-3 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
          >
            {idx + 1 < items.length ? "Lanjut →" : "Lihat ringkasan →"}
          </button>
        </div>
      )}
    </div>
  );
}
