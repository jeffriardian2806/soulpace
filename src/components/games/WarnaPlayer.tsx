"use client";

import { useState } from "react";

export type MoodColor = { hex: string; label: string; note: string };

export function WarnaPlayer({ palette }: { palette: MoodColor[] }) {
  const [picked, setPicked] = useState<MoodColor | null>(null);

  if (palette.length === 0) {
    return <p className="text-sm text-ink/50">Warna belum tersedia.</p>;
  }

  if (picked) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl p-8 transition-colors duration-700"
        style={{ background: `linear-gradient(135deg, ${picked.hex}33, ${picked.hex}99)` }}
      >
        <div className="h-32 w-32 animate-pulse rounded-full shadow-2xl" style={{ backgroundColor: picked.hex }} />
        <p className="mt-4 text-center text-lg font-bold text-ink">{picked.label}</p>
        <p className="max-w-sm text-center text-sm leading-relaxed text-ink/75">{picked.note}</p>
        <button onClick={() => setPicked(null)} className="mt-4 rounded-full bg-white/80 px-5 py-2 text-sm font-medium text-ink/70 ring-1 ring-ink/10">
          Pilih warna lain
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {palette.map((c) => (
        <button
          key={c.hex + c.label}
          onClick={() => setPicked(c)}
          aria-label={c.label}
          className="aspect-square rounded-2xl shadow-md transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}
