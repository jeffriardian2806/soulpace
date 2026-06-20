"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "soulpace:late_night_dismissed";
const COOLDOWN_HOURS = 6;

export function LateNightNudge() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 22 && hour >= 4) return; // di luar 22:00-04:00 → skip

    // Check dismissed
    const dismissedAtStr = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (dismissedAtStr) {
      const dismissedAt = parseInt(dismissedAtStr);
      if (Date.now() - dismissedAt < COOLDOWN_HOURS * 60 * 60 * 1000) return;
    }

    setShown(true);
  }, []);

  if (!shown) return null;

  const dismiss = () => {
    setShown(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  return (
    <section className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 ring-1 ring-purple-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">🌙</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink leading-snug">Lo lagi bangun jam segini.</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            Cognitive distortion lebih kuat pas malem — pikiran ngerasa lebih final dari yang sebenernya. Jangan decide major hal-hal penting sekarang. Coba breathe dulu.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/main/napas" className="rounded-full bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white">
              🌬️ Latihan Napas
            </Link>
            <Link href="/ambient" className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15">
              🎵 Suara Tenang
            </Link>
            <button onClick={dismiss} className="rounded-full bg-transparent px-2 py-1.5 text-xs font-medium text-ink/45 hover:text-ink/65">
              Ga sekarang
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
