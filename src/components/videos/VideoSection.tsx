"use client";

import { useState, useMemo } from "react";
import { VideoPlayer } from "./VideoPlayer";
import type { VideoRow } from "@/lib/videos/queries";

export function VideoSection({ videos }: { videos: VideoRow[] }) {
  const [sort, setSort] = useState<"terbaru" | "terpopuler">("terbaru");

  const sorted = useMemo(() => {
    const arr = [...videos];
    if (sort === "terbaru") {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      arr.sort((a, b) => b.total_views - a.total_views || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [videos, sort]);

  if (videos.length === 0) return null;

  return (
    <section className="mt-1">
      <div className="mb-3 flex justify-end">
        <div className="flex gap-1 rounded-full bg-ink/5 p-0.5 text-xs">
          <button
            onClick={() => setSort("terbaru")}
            className={`rounded-full px-3 py-1 font-medium transition ${sort === "terbaru" ? "bg-white text-sky-600 shadow-sm" : "text-ink/55"}`}
          >
            Terbaru
          </button>
          <button
            onClick={() => setSort("terpopuler")}
            className={`rounded-full px-3 py-1 font-medium transition ${sort === "terpopuler" ? "bg-white text-sky-600 shadow-sm" : "text-ink/55"}`}
          >
            Terpopuler
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((v) => (
          <div key={v.id} className="flex flex-col gap-2">
            <VideoPlayer videoId={v.id} youtubeId={v.youtube_id} title={v.title} thumbnailUrl={v.thumbnail_url} />
            <div>
              <p className="text-sm font-semibold text-ink line-clamp-2">{v.title}</p>
              {v.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink/60 line-clamp-2">{v.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
