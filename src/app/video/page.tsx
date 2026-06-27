import Link from "next/link";
import type { Metadata } from "next";
import { getActiveVideos } from "@/lib/videos/queries";
import { VideoSection } from "@/components/videos/VideoSection";

export const metadata: Metadata = {
  title: "Video Edukasi Kesehatan Mental — Flouwell",
  description:
    "Kumpulan video edukasi kesehatan mental dari psikolog & psikiater berlisensi: trauma, cemas, burnout, dan lainnya.",
  robots: { index: true, follow: true },
};

export default async function VideoPage() {
  const videos = await getActiveVideos();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">🎬 Video Edukasi</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">← Beranda</Link>
      </header>

      <p className="text-sm text-ink/65">
        Video edukasi dari psikolog & psikiater berlisensi. Tonton langsung di sini.
      </p>

      {videos.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">🎬</p>
          <p className="mt-2 text-base font-bold text-ink">Belum ada video</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">Video edukasi bakal segera hadir.</p>
        </div>
      ) : (
        <VideoSection videos={videos} />
      )}

      <Link href="/edukasi" className="glass mt-2 flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100">
        <span className="text-sm font-medium text-ink">
          Baca juga: Tips & Edukasi per kondisi
          <span className="block text-xs font-normal text-ink/55">Overthinking, cemas, burnout, dll</span>
        </span>
        <span className="text-sky-600">→</span>
      </Link>
    </main>
  );
}
