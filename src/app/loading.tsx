"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowText(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <div className="h-7 w-32 animate-pulse rounded-lg bg-sky-100/70" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-sky-100 bg-white/60 p-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-sky-100/70" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-sky-100/70" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-sky-100/50" />
              </div>
            </div>
            <div className="h-3 w-full animate-pulse rounded bg-sky-100/50" />
            <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-sky-100/50" />
          </div>
        ))}
      </div>
      <p
        className={`mt-2 text-center text-xs text-ink/40 transition-opacity duration-300 ${
          showText ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        Sebentar ya...
      </p>
    </main>
  );
}
