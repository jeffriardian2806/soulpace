"use client";

import { useEffect, useRef, useState } from "react";

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

// Convert YouTube URL → embed format
function toYouTubeEmbed(url: string, loop = true): string {
  let videoId = "";
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (watchMatch) videoId = watchMatch[1];
  else if (shortMatch) videoId = shortMatch[1];
  else return url;
  const loopParam = loop ? `&loop=1&playlist=${videoId}` : "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0${loopParam}`;
}

// Convert Vimeo URL → embed
function toVimeoEmbed(url: string, loop = true): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (!match) return url;
  return `https://player.vimeo.com/video/${match[1]}?autoplay=1${loop ? "&loop=1" : ""}`;
}

export function AmbientMediaPlayer({ media }: { media: Media }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync loop state
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
    if (videoRef.current) videoRef.current.loop = loop;
  }, [loop]);

  if (!media.media_url) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-xs text-amber-700">⚠️ URL belum diisi admin</p>
      </div>
    );
  }

  // === AUDIO ===
  if (media.kind === "audio") {
    return (
      <div className="flex flex-col gap-2">
        <audio ref={audioRef} src={media.media_url} controls loop={loop} className="w-full" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
        <label className="flex items-center gap-2 text-xs text-ink/65">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop continuous (auto-replay)
        </label>
      </div>
    );
  }

  // === VIDEO DIRECT (MP4) ===
  if (media.kind === "video_direct") {
    return (
      <div className="flex flex-col gap-2">
        <video ref={videoRef} src={media.media_url} controls loop={loop} playsInline className="w-full rounded-xl" poster={media.thumbnail_url ?? undefined} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
        <label className="flex items-center gap-2 text-xs text-ink/65">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop continuous
        </label>
      </div>
    );
  }

  // === YOUTUBE EMBED ===
  if (media.kind === "video_youtube") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          src={toYouTubeEmbed(media.media_url, loop)}
          title={media.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  // === VIMEO EMBED ===
  if (media.kind === "video_vimeo") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          src={toVimeoEmbed(media.media_url, loop)}
          title={media.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return null;
}
