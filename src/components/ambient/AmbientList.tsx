"use client";

import { useState } from "react";
import { AmbientMediaPlayer } from "./AmbientMediaPlayer";

type Media = {
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  kind: "audio" | "video_direct" | "video_youtube" | "video_vimeo";
  media_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
};

export function AmbientList({ items }: { items: Media[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Collect unique tags
  const allTags = Array.from(new Set(items.flatMap(i => i.tags))).sort();

  const filtered = filterTag ? items.filter(i => i.tags.includes(filterTag)) : items;

  return (
    <div className="flex flex-col gap-4">
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setFilterTag(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filterTag === null ? "bg-sky-500 text-white" : "bg-white text-ink/65 ring-1 ring-ink/10"
            }`}
          >
            Semua
          </button>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filterTag === t ? "bg-sky-500 text-white" : "bg-white text-ink/65 ring-1 ring-ink/10"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Media list */}
      {filtered.map((m) => {
        const isOpen = openSlug === m.slug;
        return (
          <section key={m.slug} className="rounded-2xl bg-white ring-1 ring-ink/8 overflow-hidden">
            <button
              onClick={() => setOpenSlug(isOpen ? null : m.slug)}
              className="flex w-full items-start gap-3 p-4 text-left hover:bg-sky-50"
            >
              <span className="text-3xl">{m.emoji ?? "🎵"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{m.title}</p>
                {m.description && <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{m.description}</p>}
                <p className="mt-1 text-[10px] text-ink/40">
                  {m.kind === "audio" ? "🔊 Audio" : "🎬 Video"} · {m.tags.map(t => `#${t}`).join(" ")}
                </p>
              </div>
              <span className="text-ink/40">{isOpen ? "▼" : "▶"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-ink/5 p-4">
                <AmbientMediaPlayer media={m} />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
