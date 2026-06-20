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

function toVimeoEmbed(url: string, loop = true): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (!match) return url;
  return `https://player.vimeo.com/video/${match[1]}?autoplay=1${loop ? "&loop=1" : ""}`;
}

export function AmbientMediaPlayer({ media }: { media: Media }) {
  const [loop, setLoop] = useState(true);
  const [duckedByTTS, setDuckedByTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Remember kalo dia lagi playing pre-duck
  const wasPlayingRef = useRef<boolean>(false);

  // Sync loop state
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
    if (videoRef.current) videoRef.current.loop = loop;
  }, [loop]);

  // === Audio ducking: listen to TTS events ===
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ playing: boolean }>).detail;
      const playing = detail?.playing;

      const el = audioRef.current ?? videoRef.current;
      if (!el) return;

      if (playing) {
        // TTS start → pause ambient if it was playing
        if (!el.paused) {
          wasPlayingRef.current = true;
          el.pause();
          setDuckedByTTS(true);
        }
      } else {
        // TTS end → resume kalo tadi sempet playing
        if (wasPlayingRef.current) {
          el.play().catch(() => {});
          wasPlayingRef.current = false;
          setDuckedByTTS(false);
        }
      }
    };
    window.addEventListener("soulpace:tts", handler as EventListener);
    return () => window.removeEventListener("soulpace:tts", handler as EventListener);
  }, []);

  if (!media.media_url) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-xs text-amber-700">⚠️ URL belum diisi admin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {duckedByTTS && (
        <p className="text-[10px] text-sky-600 italic">🔊 Auto-pause sementara TTS jalan...</p>
      )}

      {media.kind === "audio" && (
        <>
          <audio ref={audioRef} src={media.media_url} controls loop={loop} className="w-full" />
          <label className="flex items-center gap-2 text-xs text-ink/65">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
            Loop continuous (auto-replay)
          </label>
        </>
      )}

      {media.kind === "video_direct" && (
        <>
          <video ref={videoRef} src={media.media_url} controls loop={loop} playsInline className="w-full rounded-xl" poster={media.thumbnail_url ?? undefined} />
          <label className="flex items-center gap-2 text-xs text-ink/65">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
            Loop continuous
          </label>
        </>
      )}

      {media.kind === "video_youtube" && (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={toYouTubeEmbed(media.media_url, loop)}
            title={media.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}

      {media.kind === "video_vimeo" && (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={toVimeoEmbed(media.media_url, loop)}
            title={media.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}

      {(media.kind === "video_youtube" || media.kind === "video_vimeo") && (
        <p className="text-[10px] italic text-ink/40">
          💡 Iframe video — auto-pause vs TTS gak work di YouTube embed. Manual pause kalo perlu.
        </p>
      )}
    </div>
  );
}
