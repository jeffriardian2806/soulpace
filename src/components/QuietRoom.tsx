"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const LINES = [
  "Nggak harus cerita sekarang. Kamu boleh cuma hadir dulu.",
  "Tarik napas pelan… lalu satu lagi. Itu sudah cukup.",
  "Apa pun yang kamu rasa sekarang, itu valid.",
  "Kamu nggak harus kuat sepanjang waktu.",
  "Boleh berhenti sebentar. Nggak ada yang ngejar.",
  "Kamu sudah bertahan sejauh ini, dan itu bukan hal kecil.",
  "Nggak apa-apa kalau hari ini cuma bisa diam.",
  "Lepaskan dulu yang nggak bisa kamu kontrol malam ini.",
  "Kamu layak diperlakukan lembut, termasuk oleh dirimu sendiri.",
  "Pelan-pelan aja. Satu langkah kecil tetap langkah.",
  "Perasaan ini berat, tapi kamu nggak menghadapinya sendirian.",
  "Di sini, kamu nggak perlu menjelaskan apa-apa ke siapa pun.",
  "Terima kasih sudah bertahan hari ini.",
];

const COLORS = [
  "text-sky-200",
  "text-amber-200",
  "text-rose-200",
  "text-emerald-200",
  "text-violet-200",
];

export function QuietRoom() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);
  const alive = useRef(true);

  const advance = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      if (!alive.current) return;
      setIdx((i) => (i + 1) % LINES.length);
      setShow(true);
    }, 700);
  }, []);

  useEffect(() => {
    alive.current = true;
    const t = setInterval(advance, 7000);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [advance]);

  return (
    <main
      onClick={advance}
      className="relative flex min-h-screen w-full cursor-pointer select-none flex-col items-center justify-center gap-10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-8"
    >
      <p
        className={`max-w-md text-center text-2xl font-medium leading-relaxed transition-opacity duration-700 ${
          show ? "opacity-100" : "opacity-0"
        } ${COLORS[idx % COLORS.length]}`}
      >
        {LINES[idx]}
      </p>

      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-xs text-white/30">
        <span>ketuk untuk lanjut</span>
        <Link
          href="/feed"
          onClick={(e) => e.stopPropagation()}
          className="rounded-full border border-white/15 px-4 py-1.5 text-white/60 transition-colors hover:bg-white/5"
        >
          Aku sudah cukup
        </Link>
      </div>
    </main>
  );
}
