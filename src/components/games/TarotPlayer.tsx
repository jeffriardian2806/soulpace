"use client";
import { useState } from "react";

export type TarotCard = {
  id: string;
  name: string;
  emoji: string;
  meaning_situation: string;
  meaning_feeling: string;
  meaning_action: string;
};

const SLOTS = [
  { key: "situasi", label: "Situasi", desc: "Apa yang lagi kamu hadapi" },
  { key: "perasaan", label: "Perasaan", desc: "Apa yang lagi kamu rasain" },
  { key: "aksi", label: "Aksi", desc: "Apa yang bisa kamu lakuin" },
] as const;

export function TarotPlayer({ cards }: { cards: TarotCard[] }) {
  const [drawn, setDrawn] = useState<TarotCard[] | null>(null);

  if (cards.length < 3) return <p className="text-sm text-ink/50">Minimal 3 kartu dibutuhkan. Tunggu admin nambah.</p>;

  function shuffle() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDrawn(shuffled.slice(0, 3));
  }

  if (!drawn) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="relative h-48 w-32">
          <div className="absolute inset-0 rotate-[-8deg] rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-100 to-purple-100 shadow-lg" />
          <div className="absolute inset-0 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-100 to-purple-100 shadow-lg flex items-center justify-center text-4xl">🎴</div>
          <div className="absolute inset-0 rotate-[8deg] rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-100 to-purple-100 shadow-lg" />
        </div>
        <p className="max-w-sm text-center text-sm leading-relaxed text-ink/65">
          Tarik 3 kartu untuk refleksi: situasi yang lagi dihadapi, perasaan yang muncul, dan aksi yang bisa diambil. Bukan ramalan — cuma cermin pelan-pelan.
        </p>
        <button onClick={shuffle} className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white">
          Kocok &amp; tarik kartu
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {drawn.map((card, i) => {
        const slot = SLOTS[i];
        const meaning =
          slot.key === "situasi" ? card.meaning_situation :
          slot.key === "perasaan" ? card.meaning_feeling :
          card.meaning_action;
        return (
          <div key={i} className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 shadow-md">
            <p className="text-[10px] uppercase tracking-wide text-sky-600 font-semibold">{slot.label}  {slot.desc}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-4xl">{card.emoji}</p>
              <p className="text-base font-bold text-ink">{card.name}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{meaning}</p>
          </div>
        );
      })}
      <p className="mt-2 text-center text-xs text-ink/40">Catatan kecil buat refleksi — kamu yang putuskan maknanya.</p>
      <button onClick={() => setDrawn(null)} className="rounded-full bg-white/80 px-5 py-2 text-sm font-medium text-ink/70 ring-1 ring-sky-100">
        Tarik lagi
      </button>
    </div>
  );
}
