"use client";

import { useState } from "react";

export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user batal share, abaikan */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard ditolak, abaikan */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-sm text-ink/70 transition-colors hover:bg-sky-50"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 4l8 7-8 7v-4c-6 0-9 2-12 6 1-7 5-11 12-12V4z" fill="currentColor" />
      </svg>
      {copied ? "Tersalin!" : "Bagikan"}
    </button>
  );
}
