// Util buat parsing & format YouTube URL.
// Admin paste link biasa (banyak format) → extract 11-char video ID.

const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/live\/)([\w-]{11})/,
];

/** Extract 11-char YouTube video ID dari berbagai format URL. null kalau bukan YouTube valid. */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Kalau user paste ID mentah (11 char valid)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  for (const re of YT_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** Embed URL pakai youtube-nocookie (privacy-enhanced, sesuai jiwa app). */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Thumbnail URL (hqdefault = 480x360, ada di hampir semua video). */
export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Link tonton langsung di YouTube. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
