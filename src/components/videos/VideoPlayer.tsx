"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/videos/youtube";

// device-id konsisten sama EpisodeView (pakai key yang sama: sp_vid)
function deviceId(): string {
  try {
    let id = localStorage.getItem("sp_vid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("sp_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

type Props = {
  videoId: string; // DB id
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
};

export function VideoPlayer({ videoId, youtubeId, title, thumbnailUrl }: Props) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    // Catat view HANYA saat user aktif klik play (bukan saat halaman load).
    // RPC handle dedup + cap 4/24jam di server.
    const supabase = createClient();
    supabase
      .rpc("record_video_view", { p_video: videoId, p_key: deviceId() })
      .then(({ error }) => {
        if (error) console.error("record_video_view error:", error.message);
      });
  };

  const thumb = thumbnailUrl || youtubeThumbnail(youtubeId);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-ink/5"
        aria-label={`Putar video: ${title}`}
      >
        <Image
          src={thumb}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-sky-600">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={`${youtubeEmbedUrl(youtubeId)}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
