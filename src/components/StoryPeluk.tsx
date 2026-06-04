"use client";

import { useState, useTransition } from "react";
import { pelukStoryAction } from "@/app/cerita/actions";

export function StoryPeluk({
  storyId,
  initialPeluked,
  initialCount,
}: {
  storyId: string;
  initialPeluked: boolean;
  initialCount: number;
}) {
  const [peluked, setPeluked] = useState(initialPeluked);
  const [count, setCount] = useState(initialCount);
  const [, start] = useTransition();

  function toggle() {
    const was = peluked;
    setPeluked(!was);
    setCount((c) => (was ? c - 1 : c + 1));
    start(async () => {
      try {
        await pelukStoryAction(storyId, was);
      } catch {
        setPeluked(was);
        setCount((c) => (was ? c + 1 : c - 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={peluked}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        peluked ? "bg-sky-100 font-semibold text-sky-600" : "glass text-ink/70 hover:bg-sky-50"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={peluked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {peluked ? "Dipeluk" : "Peluk"} · {count}
    </button>
  );
}
